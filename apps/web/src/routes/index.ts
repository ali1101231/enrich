import { Router } from "express";
import { authRoutes } from "./auth.routes.js";
import { adminRoutes } from "./admin.routes.js";
import { batchesRoutes } from "./batches.routes.js";
import { runsRoutes } from "./runs.routes.js";
import { requireAuth } from "../middleware/auth-context.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

router.use("/auth", authRoutes);
router.use("/batches", requireAuth, batchesRoutes);
router.use("/runs", requireAuth, runsRoutes);
router.use("/admin", adminRoutes);

export { router as apiRouter };
