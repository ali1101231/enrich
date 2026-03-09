import type { Job } from "bullmq";
import type { JobPayload } from "@koldify/shared";
import { prisma } from "../lib/prisma.js";
import { BlitzClientService } from "../services/blitz-client.service.js";
import { JobStateService } from "../services/job-state.service.js";
import { KeyLimiterService } from "../services/key-limiter.service.js";

export class JobProcessor {
  constructor(
    private readonly blitzClient = new BlitzClientService(),
    private readonly stateService = new JobStateService(),
    private readonly keyLimiter = new KeyLimiterService(),
  ) {}

  async process(queueJob: Job<JobPayload>): Promise<void> {
    const attempt = queueJob.attemptsMade + 1;
    const jobId = queueJob.data.jobId;

    const dbJob = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        apiKey: true,
      },
    });

    if (!dbJob) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (dbJob.status === "COMPLETED") {
      return;
    }

    // Critical retry-safe transition gate.
    const transitioned = await this.stateService.markRunning(dbJob.id);
    if (!transitioned && dbJob.status !== "RUNNING") {
      return;
    }

    const activeJob = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        apiKey: true,
      },
    });

    if (!activeJob?.apiKey || !activeJob.apiKey.isActive) {
      throw new Error("No active API key assigned to this job");
    }

    const payload = activeJob.payload as { rows?: Array<Record<string, unknown>> };
    const rows = payload.rows ?? [];

    try {
      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index];
        const response = await this.keyLimiter.schedule(
          activeJob.apiKey.id,
          activeJob.apiKey.requestsPerSecond,
          async () => this.blitzClient.enrichRow(activeJob.apiKey!.encryptedKey, row),
        );

        await this.stateService.persistRowSuccess(activeJob.id, attempt, index, response);
        await queueJob.updateProgress({ processed: index + 1, total: rows.length });
      }

      await this.stateService.markCompleted(activeJob.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown processing failure";
      await this.stateService.persistRowFailure(activeJob.id, attempt, null, message);
      throw error;
    }
  }
}
