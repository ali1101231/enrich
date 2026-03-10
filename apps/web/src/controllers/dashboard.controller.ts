import type { Request, Response } from "express";
import { DashboardStatsService } from "../services/dashboard-stats.service.js";

export class DashboardController {
  constructor(private readonly statsService = new DashboardStatsService()) {}

  getStats = async (req: Request, res: Response): Promise<void> => {
    const userId = req.authUser!.id;
    const stats = await this.statsService.getStats(userId);
    res.status(200).json(stats);
  };
}
