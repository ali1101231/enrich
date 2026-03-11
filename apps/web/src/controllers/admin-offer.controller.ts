import { z } from "zod";
import type { Request, Response } from "express";
import { OfferService, OfferServiceError } from "../services/offer.service.js";

const createSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
  credits: z.number().int().min(1),
  maxRedemptions: z.number().int().min(1),
  isActive: z.boolean().optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(1000).nullable().optional(),
  credits: z.number().int().min(1).optional(),
  maxRedemptions: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
});

function handleOfferError(error: unknown, res: Response): boolean {
  if (error instanceof OfferServiceError) {
    res.status(error.status).json({ error: error.message });
    return true;
  }
  return false;
}

export class AdminOfferController {
  constructor(private readonly service = new OfferService()) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const items = await this.service.listAdmin();
    res.status(200).json({ items });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const body = createSchema.parse(req.body);

    try {
      const offer = await this.service.create({
        ...body,
        createdById: req.authUser?.id,
      });

      res.status(201).json(offer);
    } catch (error) {
      if (!handleOfferError(error, res)) {
        throw error;
      }
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const body = updateSchema.parse(req.body);

    try {
      const offer = await this.service.update(req.params.offerId, body);
      res.status(200).json(offer);
    } catch (error) {
      if (!handleOfferError(error, res)) {
        throw error;
      }
    }
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.service.remove(req.params.offerId);
      res.status(204).send();
    } catch (error) {
      if (!handleOfferError(error, res)) {
        throw error;
      }
    }
  };
}
