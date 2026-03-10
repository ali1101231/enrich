import { PROCESSING_QUEUE_NAME, type JobPayload } from "@koldify/shared";
import { Worker } from "bullmq";
import { getBullConnection } from "../lib/bull-connection.js";
import { env } from "../lib/env.js";
import { logError, logInfo, logWarn } from "../lib/logger.js";
import { prisma } from "../lib/prisma.js";
import { JobProcessor } from "../processors/job.processor.js";
import { JobStateService } from "../services/job-state.service.js";

export function startBlitzWorker(): Worker<JobPayload> {
  const processor = new JobProcessor();
  const stateService = new JobStateService();

  const worker = new Worker<JobPayload>(
    PROCESSING_QUEUE_NAME,
    async (job) => {
      logInfo("Job picked up from queue", {
        jobId: job.data.jobId,
        bullJobId: job.id,
        attempt: job.attemptsMade + 1,
      });
      await processor.process(job);
    },
    {
      connection: getBullConnection(),
      prefix: env.BULLMQ_PREFIX,
      concurrency: env.WORKER_CONCURRENCY,
    },
  );

  worker.on("active", (job) => {
    logInfo("Job active", { jobId: job.data.jobId, bullJobId: job.id });
  });

  worker.on("completed", (job) => {
    logInfo("Job completed", {
      jobId: job.data.jobId,
      bullJobId: job.id,
      attemptsMade: job.attemptsMade + 1,
    });
  });

  worker.on("failed", async (job, error) => {
    if (!job) {
      logError("BullMQ failed event without job", {
        message: error?.message,
      });
      return;
    }

    const dbJob = await prisma.job.findUnique({
      where: { id: job.data.jobId },
      select: { id: true, maxAttempts: true },
    });

    const attempt = job.attemptsMade + 1;
    const maxAttempts = dbJob?.maxAttempts ?? env.JOB_MAX_ATTEMPTS;
    const message = error?.message ?? "Unknown worker error";

    if (attempt >= maxAttempts) {
      await stateService.markFailed(job.data.jobId, message);
      logError("Job permanently failed", {
        jobId: job.data.jobId,
        bullJobId: job.id,
        attempt,
        maxAttempts,
        message,
      });
      return;
    }

    await stateService.markRetriable(job.data.jobId, message);
    logWarn("Job failed — will retry", {
      jobId: job.data.jobId,
      bullJobId: job.id,
      attempt,
      maxAttempts,
      message,
    });
  });

  worker.on("error", (err) => {
    logError("BullMQ worker error", {
      message: err instanceof Error ? err.message : "unknown",
    });
  });

  logInfo("BullMQ worker registered", {
    queue: PROCESSING_QUEUE_NAME,
    concurrency: env.WORKER_CONCURRENCY,
  });

  return worker;
}
