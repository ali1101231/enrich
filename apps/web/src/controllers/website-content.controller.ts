import type { Request, Response } from "express";
import { WebsiteFaqService } from "../services/website-faq.service.js";
import { WebsiteLogoService } from "../services/website-logo.service.js";
import { PublicWebsiteContentService } from "../services/website-content-public.service.js";
import { WebsiteTestimonialService } from "../services/website-testimonial.service.js";
import { WebsitePricingService } from "../services/website-pricing.service.js";

export class WebsiteContentController {
  constructor(
    private readonly websiteLogoService = new WebsiteLogoService(),
    private readonly websiteTestimonialService = new WebsiteTestimonialService(),
    private readonly websiteFaqService = new WebsiteFaqService(),
    private readonly websitePricingService = new WebsitePricingService(),
    private readonly publicWebsiteContentService = new PublicWebsiteContentService(
      websiteLogoService,
      websiteTestimonialService,
      websiteFaqService,
    ),
  ) {}

  listLogos = async (_req: Request, res: Response): Promise<void> => {
    const items = await this.websiteLogoService.listActiveLogosPublic();
    res.status(200).json({ items });
  };

  listTestimonials = async (_req: Request, res: Response): Promise<void> => {
    const items = await this.websiteTestimonialService.listActiveTestimonialsPublic();
    res.status(200).json({ items });
  };

  listFaqs = async (_req: Request, res: Response): Promise<void> => {
    const items = await this.websiteFaqService.listActiveFaqPublic();
    res.status(200).json({ items });
  };

  listPricing = async (_req: Request, res: Response): Promise<void> => {
    const items = await this.websitePricingService.listActivePlansPublic();
    res.status(200).json({ items });
  };

  listAll = async (_req: Request, res: Response): Promise<void> => {
    const content = await this.publicWebsiteContentService.getAllWebsiteContent();
    res.status(200).json(content);
  };
}