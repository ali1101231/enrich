import { Router } from "express";
import { asyncHandler } from "../middleware/error-handler.js";
import { RunHistoryController } from "../controllers/run-history.controller.js";

const router = Router();
const historyController = new RunHistoryController();

router.get("/history", asyncHandler(historyController.getRunHistory));

export { router as runsRoutes };
