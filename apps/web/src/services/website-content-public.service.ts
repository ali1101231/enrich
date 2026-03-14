import type { WebsiteFaq, WebsiteLogo, WebsiteTestimonial } from "@prisma/client";
import { WebsiteFaqService } from "./website-faq.service.js";
import { WebsiteLogoService } from "./website-logo.service.js";
import { WebsiteTestimonialService } from "./website-testimonial.service.js";

export type WebsiteContentPublicPayload = {
  logos: WebsiteLogo[];
  testimonials: WebsiteTestimonial[];
  faqs: WebsiteFaq[];
};

export class PublicWebsiteContentService {
  constructor(
    private readonly websiteLogoService = new WebsiteLogoService(),
    private readonly websiteTestimonialService = new WebsiteTestimonialService(),
    private readonly websiteFaqService = new WebsiteFaqService(),
  ) {}

  async getAllWebsiteContent(): Promise<WebsiteContentPublicPayload> {
    const [logos, testimonials, faqs] = await Promise.all([
      this.websiteLogoService.listActiveLogosPublic(),
      this.websiteTestimonialService.listActiveTestimonialsPublic(),
      this.websiteFaqService.listActiveFaqPublic(),
    ]);

    return {
      logos,
      testimonials,
      faqs,
    };
  }
}