import { z } from "zod";
import type { Request, Response } from "express";
import { WebsitePricingService, WebsitePricingServiceError } from "../services/website-pricing.service.js";

const createPlanSchema = z.object({
  name: z.string().min(1).max(160),
  subtitle: z.string().max(300).nullable().optional(),
  price: z.string().min(1).max(80),
  billingPeriod: z.string().max(120).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  ctaText: z.string().max(120).nullable().optional(),
  ctaHref: z.string().max(2000).nullable().optional(),
  isPopular: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const updatePlanSchema = z.object({
  name: z.string().min(1).max(160).optional(),
  subtitle: z.string().max(300).nullable().optional(),
  price: z.string().min(1).max(80).optional(),
  billingPeriod: z.string().max(120).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  ctaText: z.string().max(120).nullable().optional(),
  ctaHref: z.string().max(2000).nullable().optional(),
  isPopular: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const createFeatureSchema = z.object({
  text: z.string().min(1).max(1000),
  isIncluded: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const updateFeatureSchema = z.object({
  text: z.string().min(1).max(1000).optional(),
  isIncluded: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

function handleWebsitePricingError(error: unknown, res: Response): boolean {
  if (error instanceof WebsitePricingServiceError) {
    res.status(error.status).json({ error: error.message });
    return true;
  }
  return false;
}

export class AdminWebsitePricingController {
  constructor(private readonly service = new WebsitePricingService()) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const items = await this.service.listPlansAdmin();
    res.status(200).json({ items });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const body = createPlanSchema.parse(req.body);

    try {
      const item = await this.service.createPlan(body);
      res.status(201).json(item);
    } catch (error) {
      if (!handleWebsitePricingError(error, res)) {
        throw error;
      }
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const body = updatePlanSchema.parse(req.body);

    try {
      const item = await this.service.updatePlan(req.params.planId, body);
      res.status(200).json(item);
    } catch (error) {
      if (!handleWebsitePricingError(error, res)) {
        throw error;
      }
    }
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.service.deletePlan(req.params.planId);
      res.status(204).send();
    } catch (error) {
      if (!handleWebsitePricingError(error, res)) {
        throw error;
      }
    }
  };

  createFeature = async (req: Request, res: Response): Promise<void> => {
    const body = createFeatureSchema.parse(req.body);

    try {
      const item = await this.service.createFeature({
        planId: req.params.planId,
        ...body,
      });
      res.status(201).json(item);
    } catch (error) {
      if (!handleWebsitePricingError(error, res)) {
        throw error;
      }
    }
  };

  updateFeature = async (req: Request, res: Response): Promise<void> => {
    const body = updateFeatureSchema.parse(req.body);

    try {
      const item = await this.service.updateFeature(req.params.featureId, body);
      res.status(200).json(item);
    } catch (error) {
      if (!handleWebsitePricingError(error, res)) {
        throw error;
      }
    }
  };

  removeFeature = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.service.deleteFeature(req.params.featureId);
      res.status(204).send();
    } catch (error) {
      if (!handleWebsitePricingError(error, res)) {
        throw error;
      }
    }
  };
}