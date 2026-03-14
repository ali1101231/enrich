import { z } from "zod";
import type { Request, Response } from "express";
import { WebsiteLogoService, WebsiteLogoServiceError } from "../services/website-logo.service.js";

const createSchema = z.object({
  name: z.string().min(1).max(160),
  imageUrl: z.string().min(1).max(2000),
  altText: z.string().max(300).nullable().optional(),
  href: z.string().max(2000).nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(160).optional(),
  imageUrl: z.string().min(1).max(2000).optional(),
  altText: z.string().max(300).nullable().optional(),
  href: z.string().max(2000).nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

function handleWebsiteLogoError(error: unknown, res: Response): boolean {
  if (error instanceof WebsiteLogoServiceError) {
    res.status(error.status).json({ error: error.message });
    return true;
  }
  return false;
}

export class AdminWebsiteLogoController {
  constructor(private readonly service = new WebsiteLogoService()) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const items = await this.service.listLogosAdmin();
    res.status(200).json({ items });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const body = createSchema.parse(req.body);

    try {
      const item = await this.service.createLogo(body);
      res.status(201).json(item);
    } catch (error) {
      if (!handleWebsiteLogoError(error, res)) {
        throw error;
      }
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const body = updateSchema.parse(req.body);

    try {
      const item = await this.service.updateLogo(req.params.logoId, body);
      res.status(200).json(item);
    } catch (error) {
      if (!handleWebsiteLogoError(error, res)) {
        throw error;
      }
    }
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.service.deleteLogo(req.params.logoId);
      res.status(204).send();
    } catch (error) {
      if (!handleWebsiteLogoError(error, res)) {
        throw error;
      }
    }
  };
}