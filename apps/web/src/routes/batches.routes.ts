import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../middleware/error-handler.js";
import { BatchInputController } from "../controllers/batch-input.controller.js";
import { BatchStatusController } from "../controllers/batch-status.controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"));
    }
  },
});
const router = Router();
const inputController = new BatchInputController();
const statusController = new BatchStatusController();

// Input endpoints
router.post("/upload", upload.single("file"), asyncHandler(inputController.uploadCsv));
router.post("/paste", asyncHandler(inputController.pastedRows));

// Status & listing endpoints
router.get("/", asyncHandler(statusController.listUserBatches));
router.get("/:batchId", asyncHandler(statusController.getBatchById));
router.get("/:batchId/status", asyncHandler(statusController.getBatchProgress));
router.get("/:batchId/jobs", asyncHandler(statusController.listJobsForBatch));

export { router as batchesRoutes };
