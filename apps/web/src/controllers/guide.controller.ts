import type { Request, Response } from "express";
import { GuideService } from "../services/guide.service.js";

export class GuideController {
  constructor(private readonly service = new GuideService()) {}

  listActive = async (req: Request, res: Response): Promise<void> => {
    const userId = req.authUser?.id;
    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const items = await this.service.listActive();
    res.status(200).json({ items });
  };
}
