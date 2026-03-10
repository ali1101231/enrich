import { Router } from "express";
import { authRoutes } from "./auth.routes.js";
import { adminRoutes } from "./admin.routes.js";
import { batchesRoutes } from "./batches.routes.js";
import { runsRoutes } from "./runs.routes.js";
import { requireAuth } from "../middleware/auth-context.js";
import { redis } from "../lib/redis.js";
import { asyncHandler } from "../middleware/error-handler.js";
import { ExportController } from "../controllers/export.controller.js";
import { AdminPackageController } from "../controllers/admin-package.controller.js";
import { PackagePurchaseController } from "../controllers/package-purchase.controller.js";
import { CreditService } from "../services/credit.service.js";

const router = Router();
const exportController = new ExportController();
const packageController = new AdminPackageController();
const purchaseController = new PackagePurchaseController();
const creditService = new CreditService();

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

// Public: active packages for pricing page
router.get("/packages", asyncHandler(packageController.listActive));

router.use("/batches", requireAuth, batchesRoutes);
router.use("/runs", requireAuth, runsRoutes);
router.use("/admin", adminRoutes);

// Credits
router.get("/credits", requireAuth, asyncHandler(async (req, res) => {
  const userId = req.authUser?.id;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const credits = await creditService.getBalance(userId);
  res.json({ credits });
}));

// Package purchase (adds credits)
router.post("/packages/purchase", requireAuth, asyncHandler(purchaseController.purchase));

// User exports listing (all exports for current user)
router.get("/exports", requireAuth, asyncHandler(exportController.listUserExports));

// Delete user's own export
router.delete("/exports/:exportId", requireAuth, asyncHandler(exportController.deleteExport));

// Bulk delete user's own exports
router.post("/exports/bulk-delete", requireAuth, asyncHandler(exportController.bulkDeleteExports));

// Export download (by exportId) — handles its own auth (supports query-param token for direct links)
router.get("/exports/:exportId/download", asyncHandler(exportController.downloadExport));

export { router as apiRouter };
