import { PROCESSING_QUEUE_NAME } from "@koldify/shared";
import { JobStatus } from "@prisma/client";
import { processingQueue } from "../queues/processing.queue.js";
import { env } from "../lib/env.js";
import { logInfo, logWarn, logError } from "../lib/logger.js";
import { prisma } from "../prisma/client.js";

export class QueueProducerService {
  /**
   * Enqueue all QUEUED jobs for a given batch into BullMQ.
   * Each job transitions QUEUED → DISPATCHED atomically before being added to the queue.
   * Jobs that fail to enqueue remain in QUEUED for the scheduler to pick up later.
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

    // Try to find an active API key assignment for the user
    const userId = jobs[0].userId;
    const assignment = await prisma.apiKeyAssignment.findFirst({
      where: {
        userId,
        isActive: true,
        apiKey: { isActive: true },
      },
      orderBy: { updatedAt: "desc" },
      select: { apiKeyId: true },
    });

    let enqueued = 0;

    for (const job of jobs) {
      try {
        // Retry-safe: only transition if still in QUEUED
        const transition = await prisma.job.updateMany({
          where: {
            id: job.id,
            status: JobStatus.QUEUED,
          },
          data: {
            status: JobStatus.DISPATCHED,
            apiKeyId: assignment?.apiKeyId ?? null,
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
      logInfo("Batch jobs enqueued", { batchId, enqueued, total: jobs.length });
    }

    if (enqueued < jobs.length) {
      logWarn("Some batch jobs were not enqueued", {
        batchId,
        enqueued,
        skipped: jobs.length - enqueued,
      });
    }

    return enqueued;
  }
}
