import type { Request, Response } from "express";
import { UsageStatsService } from "../services/usage-stats.service.js";

export class UsageController {
  constructor(private readonly usageService = new UsageStatsService()) {}

  getMyUsage = async (req: Request, res: Response): Promise<void> => {
    const userId = req.authUser?.id;
    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const usage = await this.usageService.getUserUsage(userId);
    if (!usage) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json(usage);
  };
}