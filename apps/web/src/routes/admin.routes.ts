import { Router } from "express";
import { asyncHandler } from "../middleware/error-handler.js";
import { requireAdmin } from "../middleware/auth-context.js";
import { AdminApiKeyController } from "../controllers/admin-api-key.controller.js";
import { AdminAssignmentController } from "../controllers/admin-assignment.controller.js";
import { AdminUserController } from "../controllers/admin-user.controller.js";
import { AdminActivityController } from "../controllers/admin-activity.controller.js";

const router = Router();
const keyController = new AdminApiKeyController();
const assignmentController = new AdminAssignmentController();
const userController = new AdminUserController();
const activityController = new AdminActivityController();

router.use(requireAdmin);
router.get("/users", asyncHandler(userController.listUsers));
router.post("/keys", asyncHandler(keyController.createKey));
router.get("/keys", asyncHandler(keyController.listKeys));
router.patch("/keys/:keyId/active", asyncHandler(keyController.setActive));
router.patch("/keys/:keyId/rate-limit", asyncHandler(keyController.updateRateLimit));
router.post("/assignments/manual", asyncHandler(assignmentController.manualAssign));
router.post("/assignments/auto", asyncHandler(assignmentController.autoAssign));
router.get("/assignments", asyncHandler(assignmentController.listAssignments));
router.patch("/assignments/:assignmentId/deactivate", asyncHandler(assignmentController.deactivateAssignment));
router.delete("/users/:userId/assignments", asyncHandler(assignmentController.deactivateUserAssignments));

// Activity / all-batches
router.get("/activity/batches", asyncHandler(activityController.listAllBatches));
router.get("/activity/batches/:batchId", asyncHandler(activityController.getBatchById));
router.get("/activity/batches/:batchId/status", asyncHandler(activityController.getBatchProgress));
router.get("/activity/batches/:batchId/jobs", asyncHandler(activityController.listJobsForBatch));
router.get("/activity/batches/:batchId/results", asyncHandler(activityController.getResults));
router.get("/activity/batches/:batchId/results/counts", asyncHandler(activityController.getResultCounts));
router.post("/activity/batches/:batchId/export", asyncHandler(activityController.exportBatchCsv));
router.get("/activity/batches/:batchId/exports", asyncHandler(activityController.listExports));

export { router as adminRoutes };
