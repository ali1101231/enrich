import type { Request, Response } from "express";
import { OfferService, OfferServiceError } from "../services/offer.service.js";

function handleOfferError(error: unknown, res: Response): boolean {
  if (error instanceof OfferServiceError) {
    res.status(error.status).json({ error: error.message });
    return true;
  }
  return false;
}

export class OfferController {
  constructor(private readonly service = new OfferService()) {}

  listActive = async (req: Request, res: Response): Promise<void> => {
    const userId = req.authUser?.id;
    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const items = await this.service.listActiveForUser(userId);
    res.status(200).json({ items });
  };

  avail = async (req: Request, res: Response): Promise<void> => {
    const userId = req.authUser?.id;
    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    try {
      const result = await this.service.redeem(req.params.offerId, userId);
      res.status(200).json({
        message: `Offer availed successfully. ${result.creditsAdded} credits added.`,
        ...result,
      });
    } catch (error) {
      if (!handleOfferError(error, res)) {
        throw error;
      }
    }
  };
}
