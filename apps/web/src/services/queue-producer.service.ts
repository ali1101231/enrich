import { PROCESSING_QUEUE_NAME } from "@koldify/shared";
import { JobStatus } from "@prisma/client";
import { processingQueue } from "../queues/processing.queue.js";
import { env } from "../lib/env.js";
import { logInfo, logWarn, logError } from "../lib/logger.js";
import { prisma } from "../prisma/client.js";

export class QueueProducerService {
  /**
   * Enqueue QUEUED jobs for a batch into BullMQ, respecting both:
   * - per-user active job limit (PER_USER_ACTIVE_JOB_LIMIT)
   * - per-API-key active job limit (PER_KEY_ACTIVE_JOB_LIMIT)
   *
   * Only dispatches jobs within both budgets so that neither a single user
   * nor a shared API key gets overloaded. Remaining QUEUED jobs are picked
   * up later by the fair scheduler.
   */
  async enqueueBatchJobs(batchId: string): Promise<number> {
    const jobs = await prisma.job.findMany({
      where: {
        batchId,
        status: JobStatus.QUEUED,
      },
      select: {
        id: true,
        userId: true,
        maxAttempts: true,
      },
      orderBy: { sequence: "asc" },
    });

    if (jobs.length === 0) {
      return 0;
    }

    const userId = jobs[0].userId;

    // Try to find an active API key assignment for the user
    const assignment = await prisma.apiKeyAssignment.findFirst({
      where: {
        userId,
        isActive: true,
        apiKey: { isActive: true },
      },
      orderBy: { updatedAt: "desc" },
      select: { apiKeyId: true },
    });

    if (!assignment) {
      logWarn("No active API key assignment — leaving jobs QUEUED for scheduler", {
        batchId,
        userId,
        total: jobs.length,
      });
      return 0;
    }

    // Respect per-user active job limit
    const activeForUser = await prisma.job.count({
      where: {
        userId,
        status: { in: [JobStatus.DISPATCHED, JobStatus.RUNNING] },
      },
    });

    const userBudget = Math.max(0, env.PER_USER_ACTIVE_JOB_LIMIT - activeForUser);
    if (userBudget === 0) {
      logInfo("User at active job limit — leaving jobs QUEUED for scheduler", {
        batchId,
        userId,
        activeForUser,
        limit: env.PER_USER_ACTIVE_JOB_LIMIT,
      });
      return 0;
    }

    // Respect per-API-key active job limit — prevents overloading a shared key
    const activeForKey = await prisma.job.count({
      where: {
        apiKeyId: assignment.apiKeyId,
        status: { in: [JobStatus.DISPATCHED, JobStatus.RUNNING] },
      },
    });

    const keyBudget = Math.max(0, env.PER_KEY_ACTIVE_JOB_LIMIT - activeForKey);
    if (keyBudget === 0) {
      logInfo("API key at active job limit — leaving jobs QUEUED for scheduler", {
        batchId,
        userId,
        apiKeyId: assignment.apiKeyId,
        activeForKey,
        limit: env.PER_KEY_ACTIVE_JOB_LIMIT,
      });
      return 0;
    }

    const budget = Math.min(userBudget, keyBudget);
    const eligible = jobs.slice(0, budget);
    let enqueued = 0;

    for (const job of eligible) {
      try {
        // Retry-safe: only transition if still in QUEUED
        const transition = await prisma.job.updateMany({
          where: {
            id: job.id,
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

        await processingQueue.add(
          PROCESSING_QUEUE_NAME,
          { jobId: job.id },
          {
            jobId: job.id,
            attempts: job.maxAttempts,
            backoff: {
              type: "fixed",
              delay: env.JOB_BACKOFF_MS,
            },
            removeOnComplete: 1000,
            removeOnFail: 5000,
          },
        );

        enqueued += 1;
      } catch (err) {
        // Revert to QUEUED so the scheduler can retry later
        await prisma.job.updateMany({
          where: {
            id: job.id,
            status: JobStatus.DISPATCHED,
          },
          data: {
            status: JobStatus.QUEUED,
            queuedAt: null,
          },
        });

        logError("Failed to enqueue job", {
          jobId: job.id,
          batchId,
          message: err instanceof Error ? err.message : "unknown",
        });
      }
    }

    if (enqueued > 0) {
      // Update lastDequeuedAt for fair round-robin ordering
      await prisma.user.update({
        where: { id: userId },
        data: { lastDequeuedAt: new Date() },
      });

      logInfo("Batch jobs enqueued", { batchId, enqueued, budget, total: jobs.length });
    }

    if (enqueued < jobs.length) {
      logInfo("Remaining batch jobs deferred to scheduler", {
        batchId,
        enqueued,
        deferred: jobs.length - enqueued,
      });
    }

    return enqueued;
  }
}
