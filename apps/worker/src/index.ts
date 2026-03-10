import { startBlitzWorker } from "./workers/blitz.worker.js";
import { logError, logInfo } from "./lib/logger.js";
import { prisma } from "./lib/prisma.js";
import { redis } from "./lib/redis.js";

async function boot(): Promise<void> {
  // Verify Redis connectivity before starting the worker
  try {
    const pong = await redis.ping();
    logInfo("Redis connected", { response: pong });
  } catch (err) {
    logError("Redis connection failed — aborting worker startup", {
      message: err instanceof Error ? err.message : "unknown",
    });
    process.exit(1);
  }

  const worker = startBlitzWorker();
  logInfo("Worker service started");

  async function shutdown(signal: string): Promise<void> {
    logInfo("Shutting down worker", { signal });
    await worker.close();
    await redis.quit();
    await prisma.$disconnect();
    process.exit(0);
  }

  process.on("SIGINT", () => {
    shutdown("SIGINT").catch((error) => {
      logError("Shutdown error", { message: error instanceof Error ? error.message : "unknown" });
      process.exit(1);
    });
  });

  process.on("SIGTERM", () => {
    shutdown("SIGTERM").catch((error) => {
      logError("Shutdown error", { message: error instanceof Error ? error.message : "unknown" });
      process.exit(1);
    });
  });
}

boot().catch((err) => {
  logError("Worker boot failed", { message: err instanceof Error ? err.message : "unknown" });
  process.exit(1);
});
