import { Router } from "express";
import { adminRoutes } from "./admin.routes.js";
import { batchesRoutes } from "./batches.routes.js";
import { runsRoutes } from "./runs.routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

router.use("/batches", batchesRoutes);
router.use("/runs", runsRoutes);
router.use("/admin", adminRoutes);

export { router as apiRouter };
