import { Router } from "express";
import { authRoutes } from "./auth.routes.js";
import { adminRoutes } from "./admin.routes.js";
import { batchesRoutes } from "./batches.routes.js";
import { runsRoutes } from "./runs.routes.js";
import { requireAuth } from "../middleware/auth-context.js";
import { redis } from "../lib/redis.js";

const router = Router();

router.get("/health", async (_req, res) => {
  const checks: Record<string, string> = {};

  try {
    const pong = await redis.ping();
    checks.redis = pong === "PONG" ? "ok" : "degraded";
  } catch {
    checks.redis = "down";
  }

  const allOk = Object.values(checks).every((v) => v === "ok");
  res.status(allOk ? 200 : 503).json({ ok: allOk, checks });
});

router.use("/auth", authRoutes);
router.use("/batches", requireAuth, batchesRoutes);
router.use("/runs", requireAuth, runsRoutes);
router.use("/admin", adminRoutes);

export { router as apiRouter };
