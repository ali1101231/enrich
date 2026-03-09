import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../middleware/error-handler.js";
import { BatchInputController } from "../controllers/batch-input.controller.js";
import { BatchStatusController } from "../controllers/batch-status.controller.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();
const inputController = new BatchInputController();
const statusController = new BatchStatusController();

router.post("/upload", upload.single("file"), asyncHandler(inputController.uploadCsv));
router.post("/paste", asyncHandler(inputController.pastedRows));
router.get("/:batchId/status", asyncHandler(statusController.getBatchProgress));

export { router as batchesRoutes };
