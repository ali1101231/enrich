import type { Job } from "bullmq";
import type { JobPayload } from "@koldify/shared";
import { prisma } from "../lib/prisma.js";
import { logWarn } from "../lib/logger.js";
import { BlitzClientService, BlitzPermanentError } from "../services/blitz-client.service.js";
import { isSupportedBlitzTool } from "../services/blitz-endpoint-map.js";
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
        batch: { select: { toolId: true } },
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
        batch: { select: { toolId: true } },
      },
    });

    if (!activeJob?.apiKey || !activeJob.apiKey.isActive) {
      throw new Error("No active API key assigned to this job");
    }

    const toolId = activeJob.batch.toolId;

    // Use real Blitz processing for supported tools, mock for others
    if (toolId && isSupportedBlitzTool(toolId)) {
      await this.processBlitz(activeJob, queueJob, attempt, toolId);
    } else {
      await this.processMock(activeJob, queueJob, attempt);
    }
  }

  /** Real Blitz API processing — routes each row through the correct endpoint */
  private async processBlitz(
    activeJob: {
      id: string;
      apiKey: { id: string; encryptedKey: string; requestsPerSecond: number; isActive: boolean } | null;
      payload: unknown;
    },
    queueJob: Job<JobPayload>,
    attempt: number,
    toolId: string,
  ): Promise<void> {
    const payload = activeJob.payload as { rows?: Array<Record<string, string>> };
    const rows = payload.rows ?? [];

    try {
      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index];
        try {
          const response = await this.keyLimiter.schedule(
            activeJob.apiKey!.id,
            activeJob.apiKey!.requestsPerSecond,
            async () =>
              this.blitzClient.enrichRow(
                activeJob.apiKey!.encryptedKey,
                toolId,
                row,
              ),
          );
          await this.stateService.persistRowSuccess(activeJob.id, attempt, index, response);
        } catch (err) {
          if (err instanceof BlitzPermanentError) {
            // Permanent error for this row — save failure, continue to next
            logWarn("Row permanently failed", {
              jobId: activeJob.id,
              rowIndex: index,
              message: err.message,
            });
            await this.stateService.persistRowFailure(
              activeJob.id,
              attempt,
              index,
              err.message,
            );
            continue;
          }
          // Transient error — abort and let BullMQ retry the whole job
          throw err;
        }
        await queueJob.updateProgress({ processed: index + 1, total: rows.length });
      }

      await this.stateService.markCompleted(activeJob.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown processing failure";
      await this.stateService.persistRowFailure(activeJob.id, attempt, null, message);
      throw error;
    }
  }

  /** Mock processing for tools not yet integrated with Blitz */
  private async processMock(
    activeJob: {
      id: string;
      apiKey: { id: string; encryptedKey: string; requestsPerSecond: number; isActive: boolean } | null;
      payload: unknown;
    },
    queueJob: Job<JobPayload>,
    attempt: number,
  ): Promise<void> {
    const payload = activeJob.payload as { rows?: Array<Record<string, unknown>> };
    const rows = payload.rows ?? [];

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const response = {
        ...row,
        _provider: "mock",
        _enrichedAt: new Date().toISOString(),
      };
      await this.stateService.persistRowSuccess(activeJob.id, attempt, index, response);
      await queueJob.updateProgress({ processed: index + 1, total: rows.length });
    }

    await this.stateService.markCompleted(activeJob.id);
  }
}
