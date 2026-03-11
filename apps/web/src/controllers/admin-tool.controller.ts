import { z } from "zod";
import type { Request, Response } from "express";
import { ToolService } from "../services/tool.service.js";

const createSchema = z.object({
  toolId: z.string().min(1).max(100),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  creditCost: z.number().int().min(0).optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  creditCost: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export class AdminToolController {
  constructor(private readonly service = new ToolService()) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const items = await this.service.list();
    res.status(200).json({ items });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const body = createSchema.parse(req.body);
    const tool = await this.service.create(body);
    res.status(201).json(tool);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const body = updateSchema.parse(req.body);
    const tool = await this.service.update(req.params.toolId, body);
    res.status(200).json(tool);
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    await this.service.remove(req.params.toolId);
    res.status(204).send();
  };
}
