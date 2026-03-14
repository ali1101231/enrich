import { z } from "zod";
import type { Request, Response } from "express";
import { WebsiteFaqService, WebsiteFaqServiceError } from "../services/website-faq.service.js";

const createSchema = z.object({
  question: z.string().min(1).max(300),
  answer: z.string().min(1).max(10000),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const updateSchema = z.object({
  question: z.string().min(1).max(300).optional(),
  answer: z.string().min(1).max(10000).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

function handleWebsiteFaqError(error: unknown, res: Response): boolean {
  if (error instanceof WebsiteFaqServiceError) {
    res.status(error.status).json({ error: error.message });
    return true;
  }
  return false;
}

export class AdminWebsiteFaqController {
  constructor(private readonly service = new WebsiteFaqService()) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const items = await this.service.listFaqAdmin();
    res.status(200).json({ items });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const body = createSchema.parse(req.body);

    try {
      const item = await this.service.createFaq(body);
      res.status(201).json(item);
    } catch (error) {
      if (!handleWebsiteFaqError(error, res)) {
        throw error;
      }
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const body = updateSchema.parse(req.body);

    try {
      const item = await this.service.updateFaq(req.params.faqId, body);
      res.status(200).json(item);
    } catch (error) {
      if (!handleWebsiteFaqError(error, res)) {
        throw error;
      }
    }
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.service.deleteFaq(req.params.faqId);
      res.status(204).send();
    } catch (error) {
      if (!handleWebsiteFaqError(error, res)) {
        throw error;
      }
    }
  };
}