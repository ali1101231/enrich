import { Router } from "express";
import { authRoutes } from "./auth.routes.js";
import { adminRoutes } from "./admin.routes.js";
import { batchesRoutes } from "./batches.routes.js";
import { runsRoutes } from "./runs.routes.js";
import { requireAuth } from "../middleware/auth-context.js";
import { redis } from "../lib/redis.js";
import { asyncHandler } from "../middleware/error-handler.js";
import { ExportController } from "../controllers/export.controller.js";
import { AdminPackageController } from "../controllers/admin-package.controller.js";
import { PackagePurchaseController } from "../controllers/package-purchase.controller.js";
import { CreditService } from "../services/credit.service.js";
import { ToolService } from "../services/tool.service.js";
import { OfferController } from "../controllers/offer.controller.js";
import { GuideController } from "../controllers/guide.controller.js";
import { NewsController } from "../controllers/news.controller.js";
import { SupportController } from "../controllers/support.controller.js";
import { WebsiteContentController } from "../controllers/website-content.controller.js";
import { ContactSubmissionController } from "../controllers/contact-submission.controller.js";

const router = Router();
const exportController = new ExportController();
const packageController = new AdminPackageController();
const purchaseController = new PackagePurchaseController();
const creditService = new CreditService();
const toolService = new ToolService();
const offerController = new OfferController();
const guideController = new GuideController();
const newsController = new NewsController();
const supportController = new SupportController();
const websiteContentController = new WebsiteContentController();
const contactSubmissionController = new ContactSubmissionController();

router.get("/health", async (_req, res) => {
  const checks: Record<string, string> = {};

  try {
    const pong = await redis.ping();
    checks.redis = pong === "PONG" ? "ok" : "degraded";
  } catch {
    checks.redis = "down";
  }

  const allOk = Object.values(checks).every((v) => v === "ok");
  res.status(allOk ? 200 : 503).json({ ok: allOk, checks });
});

router.use("/auth", authRoutes);

// Public website content (no auth required)
router.get("/website-content/logos", asyncHandler(websiteContentController.listLogos));
router.get("/website-content/testimonials", asyncHandler(websiteContentController.listTestimonials));
router.get("/website-content/faqs", asyncHandler(websiteContentController.listFaqs));
router.get("/website-content/pricing", asyncHandler(websiteContentController.listPricing));
router.get("/website-content/all", asyncHandler(websiteContentController.listAll));

router.post("/contact-submissions", asyncHandler(contactSubmissionController.create));

// Public: active packages for pricing page
router.get("/packages", asyncHandler(packageController.listActive));

router.use("/batches", requireAuth, batchesRoutes);
router.use("/runs", requireAuth, runsRoutes);
router.use("/admin", adminRoutes);

// Credits
router.get("/credits", requireAuth, asyncHandler(async (req, res) => {
  const userId = req.authUser?.id;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const credits = await creditService.getBalance(userId);
  res.json({ credits });
}));

// Package purchase (adds credits)
router.post("/packages/purchase", requireAuth, asyncHandler(purchaseController.purchase));

// Offers
router.get("/offers", requireAuth, asyncHandler(offerController.listActive));
router.post("/offers/:offerId/avail", requireAuth, asyncHandler(offerController.avail));

// Guides
router.get("/guides", requireAuth, asyncHandler(guideController.listActive));

// News
router.get("/news", requireAuth, asyncHandler(newsController.listActive));

// Support
router.get("/support/tickets", requireAuth, asyncHandler(supportController.listMine));
router.post("/support/tickets", requireAuth, asyncHandler(supportController.create));
router.post("/support/tickets/:ticketId/replies", requireAuth, asyncHandler(supportController.reply));

// Tool credit cost (for authenticated users to check cost before processing)
router.get("/tools/:toolId/credit-cost", requireAuth, asyncHandler(async (req, res) => {
  const creditCost = await toolService.getCreditCost(req.params.toolId);
  res.json({ toolId: req.params.toolId, creditCost });
}));

// User exports listing (all exports for current user)
router.get("/exports", requireAuth, asyncHandler(exportController.listUserExports));

// Delete user's own export
router.delete("/exports/:exportId", requireAuth, asyncHandler(exportController.deleteExport));

// Bulk delete user's own exports
router.post("/exports/bulk-delete", requireAuth, asyncHandler(exportController.bulkDeleteExports));

// Export download (by exportId) — handles its own auth (supports query-param token for direct links)
router.get("/exports/:exportId/download", asyncHandler(exportController.downloadExport));

export { router as apiRouter };
