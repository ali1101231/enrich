import { Router } from "express";
import { asyncHandler } from "../middleware/error-handler.js";
import { RunHistoryController } from "../controllers/run-history.controller.js";
import { DashboardController } from "../controllers/dashboard.controller.js";
import { UsageController } from "../controllers/usage.controller.js";

const router = Router();
const historyController = new RunHistoryController();
const dashboardController = new DashboardController();
const usageController = new UsageController();

router.get("/history", asyncHandler(historyController.getRunHistory));
router.get("/stats", asyncHandler(dashboardController.getStats));
router.get("/usage", asyncHandler(usageController.getMyUsage));

export { router as runsRoutes };
