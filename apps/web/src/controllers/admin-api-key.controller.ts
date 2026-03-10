import { z } from "zod";
import type { Request, Response } from "express";
import { ApiKeyAssignmentService } from "../services/api-key-assignment.service.js";

const createKeySchema = z.object({
  label: z.string().min(1),
  rawKey: z.string().min(1),
});

const activeSchema = z.object({
  isActive: z.boolean(),
});

const rateLimitSchema = z.object({
  requestsPerSecond: z.number().int().min(1).max(20),
});

export class AdminApiKeyController {
  constructor(private readonly service = new ApiKeyAssignmentService()) {}

  createKey = async (req: Request, res: Response): Promise<void> => {
    const body = createKeySchema.parse(req.body);
    const created = await this.service.createApiKey(body);
    res.status(201).json(created);
  };

  listKeys = async (_req: Request, res: Response): Promise<void> => {
    const keys = await this.service.listApiKeys();
    res.status(200).json({ items: keys });
  };

  setActive = async (req: Request, res: Response): Promise<void> => {
    const body = activeSchema.parse(req.body);
    await this.service.setApiKeyActiveStatus(req.params.keyId, body.isActive);
    res.status(204).send();
  };

  updateRateLimit = async (req: Request, res: Response): Promise<void> => {
    const body = rateLimitSchema.parse(req.body);
    await this.service.updateRequestsPerSecond(req.params.keyId, body.requestsPerSecond);
    res.status(204).send();
  };
}
