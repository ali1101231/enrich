import { startBlitzWorker } from "./workers/blitz.worker.js";
import { logError, logInfo } from "./lib/logger.js";
import { prisma } from "./lib/prisma.js";

const worker = startBlitzWorker();

logInfo("Worker service started");

async function shutdown(signal: string): Promise<void> {
  logInfo("Shutting down worker", { signal });
  await worker.close();
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
