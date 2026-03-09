import type { Request, Response } from "express";
import { RunHistoryService } from "../services/run-history.service.js";

export class RunHistoryController {
  constructor(private readonly historyService = new RunHistoryService()) {}

  getRunHistory = async (req: Request, res: Response): Promise<void> => {
    const userId = req.authUser?.id ?? "demo-user";
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const history = await this.historyService.listRuns(userId, limit);
    res.status(200).json({ items: history });
  };
}
