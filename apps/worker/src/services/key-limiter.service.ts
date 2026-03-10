import Bottleneck from "bottleneck";
import { logInfo, logWarn } from "../lib/logger.js";

/**
 * Module-level singleton map of per-API-key rate limiters.
 * Shared across ALL job processors in this worker process so that
 * concurrent BullMQ jobs sharing the same API key are collectively throttled.
 */
const limiters = new Map<string, { limiter: Bottleneck; rps: number }>();

function getOrCreateLimiter(apiKeyId: string, requestsPerSecond: number): Bottleneck {
  const existing = limiters.get(apiKeyId);
  if (existing && existing.rps === requestsPerSecond) {
    return existing.limiter;
  }

  // Rate changed — stop old limiter before replacing
  if (existing) {
    existing.limiter.stop({ dropWaitingJobs: false });
    logInfo("worker.limiter.rate_changed", { apiKeyId, oldRps: existing.rps, newRps: requestsPerSecond });
  }

  const limiter = new Bottleneck({
    maxConcurrent: 1,
    reservoir: requestsPerSecond,
    reservoirRefreshAmount: requestsPerSecond,
    reservoirRefreshInterval: 1000,
    minTime: Math.ceil(1000 / requestsPerSecond),
  });

  limiter.on("depleted", () => {
    logWarn("worker.limiter.reservoir_depleted", {
      apiKeyId,
      requestsPerSecond,
      queuedJobs: limiter.queued(),
    });
  });

  limiters.set(apiKeyId, { limiter, rps: requestsPerSecond });
  logInfo("worker.limiter.created", { apiKeyId, requestsPerSecond });
  return limiter;
}

export class KeyLimiterService {
  /**
   * Schedule a task through the shared per-API-key rate limiter.
   * Logs wait time and execution duration for observability.
   */
  async schedule<T>(
    apiKeyId: string,
    requestsPerSecond: number,
    task: () => Promise<T>,
    context?: { jobId?: string; batchId?: string; rowIndex?: number },
  ): Promise<T> {
    const limiter = getOrCreateLimiter(apiKeyId, requestsPerSecond);
    const queuedCount = limiter.queued();
    const submitMs = Date.now();

    if (queuedCount > 0) {
      logInfo("worker.job.waiting_for_rate_limit", {
        apiKeyId,
        queuedAhead: queuedCount,
        ...context,
      });
    }

    return limiter.schedule(async () => {
      const waitMs = Date.now() - submitMs;
      const startMs = Date.now();

      logInfo("worker.job.request_started", {
        apiKeyId,
        limiterWaitMs: waitMs,
        ...context,
      });

      try {
        const result = await task();
        const durationMs = Date.now() - startMs;

        logInfo("worker.job.request_finished", {
          apiKeyId,
          requestDurationMs: durationMs,
          limiterWaitMs: waitMs,
          ...context,
        });

        return result;
      } catch (err) {
        const durationMs = Date.now() - startMs;

        logWarn("worker.job.request_failed", {
          apiKeyId,
          requestDurationMs: durationMs,
          limiterWaitMs: waitMs,
          message: err instanceof Error ? err.message : "unknown",
          ...context,
        });

        throw err;
      }
    });
  }
}
