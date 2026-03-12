import { z } from "zod";
import type { Request, Response } from "express";
import { NewsService, NewsServiceError } from "../services/news.service.js";

const createSchema = z.object({
  title: z.string().min(1).max(160),
  content: z.string().min(1).max(50000),
  isActive: z.boolean().optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).max(160).optional(),
  content: z.string().min(1).max(50000).optional(),
  isActive: z.boolean().optional(),
});

function handleNewsError(error: unknown, res: Response): boolean {
  if (error instanceof NewsServiceError) {
    res.status(error.status).json({ error: error.message });
    return true;
  }
  return false;
}

export class AdminNewsController {
  constructor(private readonly service = new NewsService()) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const items = await this.service.listAdmin();
    res.status(200).json({ items });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const body = createSchema.parse(req.body);

    try {
      const item = await this.service.create({
        title: body.title.trim(),
        content: body.content.trim(),
        isActive: body.isActive,
        createdById: req.authUser?.id,
      });
      res.status(201).json(item);
    } catch (error) {
      if (!handleNewsError(error, res)) {
        throw error;
      }
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const body = updateSchema.parse(req.body);

    try {
      const item = await this.service.update(req.params.newsId, {
        title: body.title?.trim(),
        content: body.content?.trim(),
        isActive: body.isActive,
      });
      res.status(200).json(item);
    } catch (error) {
      if (!handleNewsError(error, res)) {
        throw error;
      }
    }
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.service.remove(req.params.newsId);
      res.status(204).send();
    } catch (error) {
      if (!handleNewsError(error, res)) {
        throw error;
      }
    }
  };
}
