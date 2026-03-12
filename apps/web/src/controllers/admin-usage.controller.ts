import type { Request, Response } from "express";
import { UsageStatsService } from "../services/usage-stats.service.js";

export class AdminUsageController {
  constructor(private readonly usageService = new UsageStatsService()) {}

  getUsage = async (_req: Request, res: Response): Promise<void> => {
    const usage = await this.usageService.getAdminUsage();
    res.status(200).json(usage);
  };
}