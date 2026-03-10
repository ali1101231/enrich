import { Router } from "express";
import { asyncHandler } from "../middleware/error-handler.js";
import { RunHistoryController } from "../controllers/run-history.controller.js";
import { DashboardController } from "../controllers/dashboard.controller.js";

const router = Router();
const historyController = new RunHistoryController();
const dashboardController = new DashboardController();

router.get("/history", asyncHandler(historyController.getRunHistory));
router.get("/stats", asyncHandler(dashboardController.getStats));

export { router as runsRoutes };
