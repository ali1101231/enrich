import { Router } from "express";
import { asyncHandler } from "../middleware/error-handler.js";
import { AuthController } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth-context.js";

const router = Router();
const controller = new AuthController();

router.post("/register", asyncHandler(controller.register));
router.post("/login", asyncHandler(controller.login));
router.get("/me", requireAuth, asyncHandler(controller.me));

export { router as authRoutes };
