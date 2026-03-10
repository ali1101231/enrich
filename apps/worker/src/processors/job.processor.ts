import type { Job } from "bullmq";
import type { JobPayload } from "@koldify/shared";
import { prisma } from "../lib/prisma.js";
import { logInfo, logWarn } from "../lib/logger.js";
import { BlitzClientService, BlitzPermanentError, BlitzTransientError } from "../services/blitz-client.service.js";
import { isSupportedBlitzTool, validateRow } from "../services/blitz-endpoint-map.js";
import { JobStateService } from "../services/job-state.service.js";
import { KeyLimiterService } from "../services/key-limiter.service.js";

const ROW_RETRY_MAX = 3;
const ROW_RETRY_BASE_MS = 2000;

type RowResult =
  | { status: "success"; data: Record<string, unknown> }
  | { status: "permanent_failure"; error: string }
  | { status: "transient_failure"; error: string }
  | { status: "auth_error"; error: string };

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class JobProcessor {
  constructor(
    private readonly blitzClient = new BlitzClientService(),
    private readonly stateService = new JobStateService(),
    private readonly keyLimiter = new KeyLimiterService(),
  ) {}

  async process(queueJob: Job<JobPayload>): Promise<void> {
    const attempt = queueJob.attemptsMade + 1;
    const jobId = queueJob.data.jobId;
    const receivedAt = Date.now();

    logInfo("worker.job.received", {
      jobId,
      bullJobId: queueJob.id,
      attempt,
    });

    const dbJob = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        apiKey: true,
        batch: { select: { toolId: true, id: true, userId: true } },
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
        batch: { select: { toolId: true, id: true, userId: true } },
      },
    });

    if (!activeJob?.apiKey || !activeJob.apiKey.isActive) {
      throw new Error("No active API key assigned to this job");
    }

    const toolId = activeJob.batch.toolId;
    const startedAt = Date.now();

    logInfo("worker.job.processing_started", {
      jobId,
      batchId: activeJob.batch.id,
      userId: activeJob.batch.userId,
      apiKeyId: activeJob.apiKey.id,
      toolId: toolId ?? "mock",
      attempt,
      queueWaitMs: startedAt - receivedAt,
    });

    // Use real Blitz processing for supported tools, mock for others
    if (toolId && isSupportedBlitzTool(toolId)) {
      await this.processBlitz(activeJob, queueJob, attempt, toolId);
    } else {
      await this.processMock(activeJob, queueJob, attempt);
    }

    logInfo("worker.job.processing_finished", {
      jobId,
      batchId: activeJob.batch.id,
      totalDurationMs: Date.now() - receivedAt,
    });
  }

  /** Real Blitz API processing — routes each row through the correct endpoint */
  private async processBlitz(
    activeJob: {
      id: string;
      apiKey: { id: string; encryptedKey: string; requestsPerSecond: number; isActive: boolean } | null;
      payload: unknown;
      batch: { id: string; userId: string; toolId: string | null };
    },
    queueJob: Job<JobPayload>,
    attempt: number,
    toolId: string,
  ): Promise<void> {
    const payload = activeJob.payload as { rows?: Array<Record<string, string>> };
    const rows = payload.rows ?? [];

    // Track rows that need retry (transient failures like 429/5xx)
    let retryQueue: Array<{ index: number; row: Record<string, string>; lastError: string }> = [];

    // First pass: process all rows, collect transient failures for retry
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];

      // Pre-validate: skip rows missing required input (e.g. no LinkedIn URL)
      const skipReason = validateRow(toolId, row);
      if (skipReason) {
        logInfo("Row skipped — missing required input", {
          jobId: activeJob.id,
          rowIndex: index,
          reason: skipReason,
        });
        await this.stateService.persistRowSkipped(activeJob.id, attempt, index, skipReason, row);
        await queueJob.updateProgress({ processed: index + 1, total: rows.length });
        continue;
      }

      const result = await this.tryProcessRow(activeJob, toolId, row, index);
      if (result.status === "success") {
        await this.stateService.persistRowSuccess(activeJob.id, attempt, index, result.data);
      } else if (result.status === "permanent_failure") {
        await this.stateService.persistRowFailure(activeJob.id, attempt, index, result.error);
      } else if (result.status === "auth_error") {
        // Auth error (401/403) — key is bad, abort the whole job
        throw new BlitzTransientError(result.error);
      } else {
        // Transient failure (429/5xx) — queue for retry at end
        retryQueue.push({ index, row, lastError: result.error });
      }
      await queueJob.updateProgress({ processed: index + 1, total: rows.length });
    }

    // Retry rounds: re-attempt failed rows with exponential backoff
    for (let round = 0; round < ROW_RETRY_MAX && retryQueue.length > 0; round += 1) {
      const backoffMs = ROW_RETRY_BASE_MS * Math.pow(2, round);
      logInfo("worker.job.retry_round", {
        jobId: activeJob.id,
        round: round + 1,
        maxRounds: ROW_RETRY_MAX,
        failedRows: retryQueue.length,
        backoffMs,
      });
      await delay(backoffMs);

      const stillFailed: typeof retryQueue = [];
      for (const failed of retryQueue) {
        const result = await this.tryProcessRow(activeJob, toolId, failed.row, failed.index);
        if (result.status === "success") {
          await this.stateService.persistRowSuccess(activeJob.id, attempt, failed.index, result.data);
        } else if (result.status === "permanent_failure") {
          await this.stateService.persistRowFailure(activeJob.id, attempt, failed.index, result.error);
        } else {
          // Still transient — keep for next round
          stillFailed.push({ index: failed.index, row: failed.row, lastError: result.error });
        }
      }
      retryQueue = stillFailed;
    }

    // Persist any remaining failures after all retry rounds
    for (const failed of retryQueue) {
      logWarn("Row failed after all retries", {
        jobId: activeJob.id,
        rowIndex: failed.index,
        error: failed.lastError,
      });
      await this.stateService.persistRowFailure(activeJob.id, attempt, failed.index, failed.lastError);
    }

    // Job always completes — individual row failures are tracked in JobResult
    await this.stateService.markCompleted(activeJob.id);
  }

  /** Attempt a single row enrichment, returning a typed result instead of throwing */
  private async tryProcessRow(
    activeJob: {
      id: string;
      apiKey: { id: string; encryptedKey: string; requestsPerSecond: number; isActive: boolean } | null;
      batch: { id: string; userId: string; toolId: string | null };
    },
    toolId: string,
    row: Record<string, string>,
    index: number,
  ): Promise<RowResult> {
    const limiterContext = {
      jobId: activeJob.id,
      batchId: activeJob.batch.id,
      rowIndex: index,
    };
    try {
      const response = await this.keyLimiter.schedule(
        activeJob.apiKey!.id,
        activeJob.apiKey!.requestsPerSecond,
        async () =>
          this.blitzClient.enrichRow(activeJob.apiKey!.encryptedKey, toolId, row),
        limiterContext,
      );
      return { status: "success", data: response };
    } catch (err) {
      if (err instanceof BlitzPermanentError) {
        return { status: "permanent_failure", error: err.message };
      }
      if (err instanceof BlitzTransientError) {
        // Auth errors should abort the whole job (key is invalid)
        if (err.statusCode === 401 || err.statusCode === 403) {
          return { status: "auth_error", error: err.message };
        }
        // 429/5xx — transient, retry at end of job
        return { status: "transient_failure", error: err.message };
      }
      // Unknown error — treat as transient
      return { status: "transient_failure", error: err instanceof Error ? err.message : "Unknown error" };
    }
  }

  /** Mock processing for tools not yet integrated with Blitz */
  private async processMock(
    activeJob: {
      id: string;
      apiKey: { id: string; encryptedKey: string; requestsPerSecond: number; isActive: boolean } | null;
      payload: unknown;
      batch: { id: string; userId: string; toolId: string | null };
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
