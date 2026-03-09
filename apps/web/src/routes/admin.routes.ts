import { Router } from "express";
import { asyncHandler } from "../middleware/error-handler.js";
import { requireAdmin } from "../middleware/auth-context.js";
import { AdminApiKeyController } from "../controllers/admin-api-key.controller.js";
import { AdminAssignmentController } from "../controllers/admin-assignment.controller.js";
import { AdminUserController } from "../controllers/admin-user.controller.js";

const router = Router();
const keyController = new AdminApiKeyController();
const assignmentController = new AdminAssignmentController();
const userController = new AdminUserController();

router.use(requireAdmin);
router.get("/users", asyncHandler(userController.listUsers));
router.post("/keys", asyncHandler(keyController.createKey));
router.get("/keys", asyncHandler(keyController.listKeys));
router.patch("/keys/:keyId/active", asyncHandler(keyController.setActive));
router.post("/assignments/manual", asyncHandler(assignmentController.manualAssign));
router.post("/assignments/auto", asyncHandler(assignmentController.autoAssign));
router.get("/assignments", asyncHandler(assignmentController.listAssignments));

export { router as adminRoutes };
