import { z } from "zod";
import type { Request, Response } from "express";
import { WebsiteTestimonialService, WebsiteTestimonialServiceError } from "../services/website-testimonial.service.js";

const createSchema = z.object({
  clientName: z.string().min(1).max(160),
  clientRole: z.string().max(160).nullable().optional(),
  companyName: z.string().max(160).nullable().optional(),
  quote: z.string().min(1).max(5000),
  avatarUrl: z.string().max(2000).nullable().optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const updateSchema = z.object({
  clientName: z.string().min(1).max(160).optional(),
  clientRole: z.string().max(160).nullable().optional(),
  companyName: z.string().max(160).nullable().optional(),
  quote: z.string().min(1).max(5000).optional(),
  avatarUrl: z.string().max(2000).nullable().optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

function handleWebsiteTestimonialError(error: unknown, res: Response): boolean {
  if (error instanceof WebsiteTestimonialServiceError) {
    res.status(error.status).json({ error: error.message });
    return true;
  }
  return false;
}

export class AdminWebsiteTestimonialController {
  constructor(private readonly service = new WebsiteTestimonialService()) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const items = await this.service.listTestimonialsAdmin();
    res.status(200).json({ items });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const body = createSchema.parse(req.body);

    try {
      const item = await this.service.createTestimonial(body);
      res.status(201).json(item);
    } catch (error) {
      if (!handleWebsiteTestimonialError(error, res)) {
        throw error;
      }
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const body = updateSchema.parse(req.body);

    try {
      const item = await this.service.updateTestimonial(req.params.testimonialId, body);
      res.status(200).json(item);
    } catch (error) {
      if (!handleWebsiteTestimonialError(error, res)) {
        throw error;
      }
    }
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.service.deleteTestimonial(req.params.testimonialId);
      res.status(204).send();
    } catch (error) {
      if (!handleWebsiteTestimonialError(error, res)) {
        throw error;
      }
    }
  };
}