import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { apiRouter } from "./routes/index.js";
import { env } from "./lib/env.js";
import { logError, logInfo } from "./lib/logger.js";
import { attachAuthContext } from "./middleware/auth-context.js";
import { errorHandler } from "./middleware/error-handler.js";
import { attachRequestId } from "./middleware/request-id.js";
import { FairSchedulerService } from "./services/fair-scheduler.service.js";

const app = express();
const scheduler = new FairSchedulerService();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, "../../../frontend/dist");
const frontendIndexPath = path.join(frontendDistPath, "index.html");
const hasBundledFrontend = fs.existsSync(frontendIndexPath);

app.disable("x-powered-by");
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(attachRequestId);
app.use(attachAuthContext);
app.use("/api", apiRouter);

if (hasBundledFrontend) {
  app.use(express.static(frontendDistPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      next();
      return;
    }
    res.sendFile(frontendIndexPath);
  });
} else {
  app.get("/", (_req, res) => {
    res.status(200).json({
      ok: true,
      message: "Koldify API is running. Frontend build not found in this service.",
      apiBasePath: "/api",
    });
  });
}

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
