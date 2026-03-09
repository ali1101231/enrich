import express from "express";
import { apiRouter } from "./routes/index.js";
import { env } from "./lib/env.js";
import { logError, logInfo } from "./lib/logger.js";
import { attachAuthContext } from "./middleware/auth-context.js";
import { errorHandler } from "./middleware/error-handler.js";
import { attachRequestId } from "./middleware/request-id.js";
import { FairSchedulerService } from "./services/fair-scheduler.service.js";

const app = express();
const scheduler = new FairSchedulerService();

app.disable("x-powered-by");
app.use(express.json({ limit: "10mb" }));
app.use(attachRequestId);
app.use(attachAuthContext);
app.use("/api", apiRouter);
app.use(errorHandler);

setInterval(async () => {
  try {
    // Polling the DB-backed fair scheduler keeps queue filling balanced across users.
    await scheduler.refillQueue();
  } catch (error) {
    logError("Scheduler poll failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
  }
}, env.SCHEDULER_POLL_MS).unref();

app.listen(env.WEB_PORT, () => {
  logInfo("Web service started", { port: env.WEB_PORT });
});
