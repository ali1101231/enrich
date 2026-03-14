import { Router } from "express";
import { asyncHandler } from "../middleware/error-handler.js";
import { requireAdmin } from "../middleware/auth-context.js";
import { AdminApiKeyController } from "../controllers/admin-api-key.controller.js";
import { AdminAssignmentController } from "../controllers/admin-assignment.controller.js";
import { AdminUserController } from "../controllers/admin-user.controller.js";
import { AdminActivityController } from "../controllers/admin-activity.controller.js";
import { AdminPackageController } from "../controllers/admin-package.controller.js";
import { AdminToolController } from "../controllers/admin-tool.controller.js";
import { AdminOfferController } from "../controllers/admin-offer.controller.js";
import { AdminGuideController } from "../controllers/admin-guide.controller.js";
import { AdminNewsController } from "../controllers/admin-news.controller.js";
import { AdminUsageController } from "../controllers/admin-usage.controller.js";
import { AdminSupportController } from "../controllers/admin-support.controller.js";
import { AdminWebsiteLogoController } from "../controllers/admin-website-logo.controller.js";
import { AdminWebsiteTestimonialController } from "../controllers/admin-website-testimonial.controller.js";
import { AdminWebsiteFaqController } from "../controllers/admin-website-faq.controller.js";

const router = Router();
const keyController = new AdminApiKeyController();
const assignmentController = new AdminAssignmentController();
const userController = new AdminUserController();
const activityController = new AdminActivityController();
const packageController = new AdminPackageController();
const toolController = new AdminToolController();
const offerController = new AdminOfferController();
const guideController = new AdminGuideController();
const newsController = new AdminNewsController();
const usageController = new AdminUsageController();
const supportController = new AdminSupportController();
const websiteLogoController = new AdminWebsiteLogoController();
const websiteTestimonialController = new AdminWebsiteTestimonialController();
const websiteFaqController = new AdminWebsiteFaqController();

router.use(requireAdmin);
router.get("/usage", asyncHandler(usageController.getUsage));
router.get("/users", asyncHandler(userController.listUsers));
router.get("/users/:userId", asyncHandler(userController.getUserDetail));
router.patch("/users/:userId/role", asyncHandler(userController.updateUserRole));
router.patch("/users/:userId/credits", asyncHandler(userController.updateCredits));
router.delete("/users/:userId", asyncHandler(userController.deleteUser));
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
router.get("/activity/exports", asyncHandler(activityController.listAllExports));
router.delete("/activity/exports/:exportId", asyncHandler(activityController.deleteExport));
router.post("/activity/exports/bulk-delete", asyncHandler(activityController.bulkDeleteExports));

// Packages
router.get("/packages", asyncHandler(packageController.list));
router.post("/packages", asyncHandler(packageController.create));
router.get("/packages/:packageId", asyncHandler(packageController.getById));
router.patch("/packages/:packageId", asyncHandler(packageController.update));
router.delete("/packages/:packageId", asyncHandler(packageController.remove));

// Tools
router.get("/tools", asyncHandler(toolController.list));
router.post("/tools", asyncHandler(toolController.create));
router.patch("/tools/:toolId", asyncHandler(toolController.update));
router.delete("/tools/:toolId", asyncHandler(toolController.remove));

// Offers
router.get("/offers", asyncHandler(offerController.list));
router.post("/offers", asyncHandler(offerController.create));
router.patch("/offers/:offerId", asyncHandler(offerController.update));
router.delete("/offers/:offerId", asyncHandler(offerController.remove));

// Guides
router.get("/guides", asyncHandler(guideController.list));
router.post("/guides", asyncHandler(guideController.create));
router.patch("/guides/:guideId", asyncHandler(guideController.update));
router.delete("/guides/:guideId", asyncHandler(guideController.remove));

// News
router.get("/news", asyncHandler(newsController.list));
router.post("/news", asyncHandler(newsController.create));
router.patch("/news/:newsId", asyncHandler(newsController.update));
router.delete("/news/:newsId", asyncHandler(newsController.remove));

// Support
router.get("/support/tickets", asyncHandler(supportController.list));
router.post("/support/tickets/:ticketId/replies", asyncHandler(supportController.reply));
router.patch("/support/tickets/:ticketId/status", asyncHandler(supportController.updateStatus));

// Website logos
router.get("/website/logos", asyncHandler(websiteLogoController.list));
router.post("/website/logos", asyncHandler(websiteLogoController.create));
router.patch("/website/logos/:logoId", asyncHandler(websiteLogoController.update));
router.delete("/website/logos/:logoId", asyncHandler(websiteLogoController.remove));

// Website testimonials
router.get("/website/testimonials", asyncHandler(websiteTestimonialController.list));
router.post("/website/testimonials", asyncHandler(websiteTestimonialController.create));
router.patch("/website/testimonials/:testimonialId", asyncHandler(websiteTestimonialController.update));
router.delete("/website/testimonials/:testimonialId", asyncHandler(websiteTestimonialController.remove));

// Website FAQs
router.get("/website/faqs", asyncHandler(websiteFaqController.list));
router.post("/website/faqs", asyncHandler(websiteFaqController.create));
router.patch("/website/faqs/:faqId", asyncHandler(websiteFaqController.update));
router.delete("/website/faqs/:faqId", asyncHandler(websiteFaqController.remove));

export { router as adminRoutes };
