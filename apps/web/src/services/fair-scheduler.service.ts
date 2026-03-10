import { PROCESSING_QUEUE_NAME } from "@koldify/shared";
import { JobStatus } from "@prisma/client";
import { processingQueue } from "../queues/processing.queue.js";
import { env } from "../lib/env.js";
import { logInfo, logWarn, logError } from "../lib/logger.js";
import { prisma } from "../prisma/client.js";

const STALE_DISPATCHED_MINUTES = 10;

export class FairSchedulerService {
  /**
   * Fair round-robin scheduler: picks one QUEUED job per eligible user per pass,
   * cycling through users sorted by `lastDequeuedAt` (least-recently-served first).
   *
   * Enforces:
   * - per-user active job cap (PER_USER_ACTIVE_JOB_LIMIT)
   * - per-API-key active job cap (PER_KEY_ACTIVE_JOB_LIMIT) — prevents overloading shared keys
   * - skips users without active key assignments
   * - atomic DB transitions to prevent double-dispatching
   *
   * Idempotent — safe to call concurrently from multiple instances.
   */
  async refillQueue(): Promise<number> {
    // Recover orphaned DISPATCHED jobs first (stuck without a BullMQ entry)
    await this.recoverStaleDispatched();

    const activeApiKeyCount = await prisma.apiKey.count({
      where: { isActive: true },
    });

    if (activeApiKeyCount === 0) {
      return 0;
    }

    // Round-robin: select users who have QUEUED jobs AND an active key assignment,
    // ordered by lastDequeuedAt ascending (least recently served first).
    const candidateUsers = await prisma.user.findMany({
      where: {
        jobs: {
          some: {
            status: JobStatus.QUEUED,
          },
        },
        assignments: {
          some: {
            isActive: true,
            apiKey: {
              isActive: true,
            },
          },
        },
      },
      orderBy: {
        lastDequeuedAt: "asc",
      },
      select: {
        id: true,
      },
    });

    if (candidateUsers.length === 0) {
      return 0;
    }

    // Track per-key active counts for this scheduler pass (cache to avoid repeated queries)
    const keyActiveCountCache = new Map<string, number>();

    let enqueued = 0;
    let keepScanning = true;

    while (enqueued < env.SCHEDULER_MAX_ENQUEUE && keepScanning) {
      let progressed = false;

      for (const user of candidateUsers) {
        if (enqueued >= env.SCHEDULER_MAX_ENQUEUE) {
          break;
        }

        // Per-user active job cap: skip if at limit
        const activeForUser = await prisma.job.count({
          where: {
            userId: user.id,
            status: {
              in: [JobStatus.DISPATCHED, JobStatus.RUNNING],
            },
          },
        });

        if (activeForUser >= env.PER_USER_ACTIVE_JOB_LIMIT) {
          logInfo("scheduler.job_skipped_due_to_user_cap", {
            userId: user.id,
            activeForUser,
            limit: env.PER_USER_ACTIVE_JOB_LIMIT,
          });
          continue;
        }

        // Skip users whose active key assignment was deactivated since the query
        const assignment = await prisma.apiKeyAssignment.findFirst({
          where: {
            userId: user.id,
            isActive: true,
            apiKey: {
              isActive: true,
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
          select: {
            apiKeyId: true,
          },
        });

        if (!assignment) {
          logInfo("scheduler.job_skipped_due_to_missing_key", {
            userId: user.id,
          });
          continue;
        }

        // Per-API-key active job cap: prevent overloading a shared key
        let activeForKey = keyActiveCountCache.get(assignment.apiKeyId);
        if (activeForKey === undefined) {
          activeForKey = await prisma.job.count({
            where: {
              apiKeyId: assignment.apiKeyId,
              status: {
                in: [JobStatus.DISPATCHED, JobStatus.RUNNING],
              },
            },
          });
          keyActiveCountCache.set(assignment.apiKeyId, activeForKey);
        }

        if (activeForKey >= env.PER_KEY_ACTIVE_JOB_LIMIT) {
          logInfo("scheduler.job_skipped_due_to_key_cap", {
            userId: user.id,
            apiKeyId: assignment.apiKeyId,
            activeForKey,
            limit: env.PER_KEY_ACTIVE_JOB_LIMIT,
          });
          continue;
        }

        const nextJob = await prisma.job.findFirst({
          where: {
            userId: user.id,
            status: JobStatus.QUEUED,
          },
          orderBy: {
            createdAt: "asc",
          },
          select: {
            id: true,
            maxAttempts: true,
            batchId: true,
          },
        });

        if (!nextJob) {
          continue;
        }

        // Atomic transition gate: only dispatch if still QUEUED (prevents double-dispatch)
        const transition = await prisma.job.updateMany({
          where: {
            id: nextJob.id,
            status: JobStatus.QUEUED,
          },
          data: {
            status: JobStatus.DISPATCHED,
            apiKeyId: assignment.apiKeyId,
            queuedAt: new Date(),
          },
        });

        if (transition.count !== 1) {
          continue;
        }

        try {
          await processingQueue.add(
            PROCESSING_QUEUE_NAME,
            {
              jobId: nextJob.id,
            },
            {
              jobId: nextJob.id,
              attempts: nextJob.maxAttempts,
              backoff: {
                type: "fixed",
                delay: env.JOB_BACKOFF_MS,
              },
              removeOnComplete: 1000,
              removeOnFail: 5000,
            },
          );
        } catch (err) {
          // BullMQ add failed — revert to QUEUED so we don't orphan the job
          await prisma.job.updateMany({
            where: { id: nextJob.id, status: JobStatus.DISPATCHED },
            data: { status: JobStatus.QUEUED, queuedAt: null },
          });
          logError("Scheduler failed to add job to BullMQ — reverted to QUEUED", {
            jobId: nextJob.id,
            message: err instanceof Error ? err.message : "unknown",
          });
          continue;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastDequeuedAt: new Date() },
        });

        // Update the cached per-key count
        keyActiveCountCache.set(assignment.apiKeyId, (keyActiveCountCache.get(assignment.apiKeyId) ?? 0) + 1);

        enqueued += 1;
        progressed = true;

        logInfo("scheduler.job_dispatched", {
          jobId: nextJob.id,
          batchId: nextJob.batchId,
          userId: user.id,
          apiKeyId: assignment.apiKeyId,
          activeForKey: (keyActiveCountCache.get(assignment.apiKeyId) ?? 0),
          activeForUser: activeForUser + 1,
        });
      }

      keepScanning = progressed;
    }

    if (enqueued > 0) {
      logInfo("scheduler.pass_complete", { enqueued });
    }

    return enqueued;
  }

  /**
   * Recover jobs stuck in DISPATCHED for too long (orphaned by a crashed process
   * or a failed BullMQ add that was not properly reverted). Resets them to QUEUED
   * so the next scheduler pass can re-dispatch them.
   */
  private async recoverStaleDispatched(): Promise<void> {
    const staleThreshold = new Date(Date.now() - STALE_DISPATCHED_MINUTES * 60 * 1000);

    const recovered = await prisma.job.updateMany({
      where: {
        status: JobStatus.DISPATCHED,
        queuedAt: {
          lt: staleThreshold,
        },
      },
      data: {
        status: JobStatus.QUEUED,
        queuedAt: null,
      },
    });

    if (recovered.count > 0) {
      logWarn("Recovered stale DISPATCHED jobs", { count: recovered.count });
    }
  }
}
