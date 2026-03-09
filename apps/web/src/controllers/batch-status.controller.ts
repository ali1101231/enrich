import type { Request, Response } from "express";
import { BatchProgressService } from "../services/batch-progress.service.js";

export class BatchStatusController {
  constructor(private readonly progressService = new BatchProgressService()) {}

  getBatchProgress = async (req: Request, res: Response): Promise<void> => {
    const batchId = req.params.batchId;
    const progress = await this.progressService.getBatchProgress(batchId);
    res.status(200).json(progress);
  };
}
