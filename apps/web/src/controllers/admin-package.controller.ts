import { z } from "zod";
import type { Request, Response } from "express";
import { PackageService } from "../services/package.service.js";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  credits: z.number().int().min(0),
  monthlyPrice: z.number().min(0),
  yearlyPrice: z.number().min(0),
  isTopLevel: z.boolean().optional(),
  isHighlighted: z.boolean().optional(),
  badge: z.string().max(50).optional(),
  subtitle: z.string().max(500).optional(),
  buttonText: z.string().max(100).optional(),
  features: z.array(z.string().max(200)).optional(),
  sortOrder: z.number().int().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  credits: z.number().int().min(0).optional(),
  monthlyPrice: z.number().min(0).optional(),
  yearlyPrice: z.number().min(0).optional(),
  isTopLevel: z.boolean().optional(),
  isActive: z.boolean().optional(),
  isHighlighted: z.boolean().optional(),
  badge: z.string().max(50).nullable().optional(),
  subtitle: z.string().max(500).nullable().optional(),
  buttonText: z.string().max(100).optional(),
  features: z.array(z.string().max(200)).optional(),
  sortOrder: z.number().int().optional(),
});

export class AdminPackageController {
  constructor(private readonly service = new PackageService()) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const body = createSchema.parse(req.body);
    const pkg = await this.service.create(body);
    res.status(201).json(pkg);
  };

  list = async (_req: Request, res: Response): Promise<void> => {
    const items = await this.service.list();
    res.status(200).json({ items });
  };

  listActive = async (_req: Request, res: Response): Promise<void> => {
    const items = await this.service.listActive();
    res.status(200).json({ items });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const pkg = await this.service.getById(req.params.packageId);
    if (!pkg) {
      res.status(404).json({ error: "Package not found" });
      return;
    }
    res.status(200).json(pkg);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const body = updateSchema.parse(req.body);
    const pkg = await this.service.update(req.params.packageId, body);
    res.status(200).json(pkg);
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    await this.service.remove(req.params.packageId);
    res.status(204).send();
  };
}
