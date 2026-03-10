import { Router } from "express";
import { authRoutes } from "./auth.routes.js";
import { adminRoutes } from "./admin.routes.js";
import { batchesRoutes } from "./batches.routes.js";
import { runsRoutes } from "./runs.routes.js";
import { requireAuth } from "../middleware/auth-context.js";
import { redis } from "../lib/redis.js";
import { asyncHandler } from "../middleware/error-handler.js";
import { ExportController } from "../controllers/export.controller.js";

const router = Router();
const exportController = new ExportController();

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

// User exports listing (all exports for current user)
router.get("/exports", requireAuth, asyncHandler(exportController.listUserExports));

// Delete user's own export
router.delete("/exports/:exportId", requireAuth, asyncHandler(exportController.deleteExport));

// Bulk delete user's own exports
router.post("/exports/bulk-delete", requireAuth, asyncHandler(exportController.bulkDeleteExports));

// Export download (by exportId) — handles its own auth (supports query-param token for direct links)
router.get("/exports/:exportId/download", asyncHandler(exportController.downloadExport));

export { router as apiRouter };
