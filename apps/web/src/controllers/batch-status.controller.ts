import type { Request, Response } from "express";
import { BatchProgressService } from "../services/batch-progress.service.js";
import { BatchResultsService } from "../services/batch-results.service.js";

export class BatchStatusController {
  constructor(
    private readonly progressService = new BatchProgressService(),
    private readonly resultsService = new BatchResultsService(),
  ) {}

  getBatchProgress = async (req: Request, res: Response): Promise<void> => {
    const batchId = req.params.batchId;
    const progress = await this.progressService.getBatchProgress(batchId);
    res.status(200).json(progress);
  };

  getBatchById = async (req: Request, res: Response): Promise<void> => {
    const batchId = req.params.batchId;
    const batch = await this.progressService.getBatchById(batchId);
    if (!batch) {
      res.status(404).json({ error: "Batch not found" });
      return;
    }
    res.status(200).json(batch);
  };

  listUserBatches = async (req: Request, res: Response): Promise<void> => {
    const userId = req.authUser?.id ?? "demo-user";
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const batches = await this.progressService.listUserBatches(userId, limit);
    res.status(200).json({ items: batches });
  };

  listJobsForBatch = async (req: Request, res: Response): Promise<void> => {
    const batchId = req.params.batchId;
    const jobs = await this.progressService.listJobsForBatch(batchId);
    res.status(200).json({ items: jobs });
  };

  getResults = async (req: Request, res: Response): Promise<void> => {
    const batchId = req.params.batchId;
    const status = req.query.status as "SUCCESS" | "FAILURE" | undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 200;
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    const results = await this.resultsService.getResults(batchId, { status, limit, offset });
    res.status(200).json(results);
  };

  getResultCounts = async (req: Request, res: Response): Promise<void> => {
    const batchId = req.params.batchId;
    const counts = await this.resultsService.getCounts(batchId);
    res.status(200).json(counts);
  };
}
