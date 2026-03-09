import { PROCESSING_QUEUE_NAME } from "@koldify/shared";
import { JobStatus } from "@prisma/client";
import { processingQueue } from "../queues/processing.queue.js";
import { env } from "../lib/env.js";
import { logInfo } from "../lib/logger.js";
import { prisma } from "../prisma/client.js";

export class FairSchedulerService {
  async refillQueue(): Promise<number> {
    const activeApiKeyCount = await prisma.apiKey.count({
      where: { isActive: true },
    });

    if (activeApiKeyCount === 0) {
      return 0;
    }

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

    let enqueued = 0;
    let keepScanning = true;

    while (enqueued < env.SCHEDULER_MAX_ENQUEUE && keepScanning) {
      let progressed = false;

      for (const user of candidateUsers) {
        if (enqueued >= env.SCHEDULER_MAX_ENQUEUE) {
          break;
        }

        const activeForUser = await prisma.job.count({
          where: {
            userId: user.id,
            status: {
              in: [JobStatus.QUEUED_FOR_WORKER, JobStatus.RUNNING],
            },
          },
        });

        if (activeForUser >= env.PER_USER_ACTIVE_JOB_LIMIT) {
          continue;
        }

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
          },
        });

        if (!nextJob) {
          continue;
        }

        // Retry-safe state transition: queue only if still in QUEUED.
        const transition = await prisma.job.updateMany({
          where: {
            id: nextJob.id,
            status: JobStatus.QUEUED,
          },
          data: {
            status: JobStatus.QUEUED_FOR_WORKER,
            apiKeyId: assignment.apiKeyId,
            queuedAt: new Date(),
          },
        });

        if (transition.count !== 1) {
          continue;
        }

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

        await prisma.user.update({
          where: { id: user.id },
          data: { lastDequeuedAt: new Date() },
        });

        enqueued += 1;
        progressed = true;
      }

      keepScanning = progressed;
    }

    if (enqueued > 0) {
      logInfo("Scheduler queued jobs", { enqueued });
    }

    return enqueued;
  }
}
