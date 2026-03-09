import { z } from "zod";
import { CsvParserService } from "../services/csv-parser.service.js";
import { BatchCreationService } from "../services/batch-creation.service.js";
import { FairSchedulerService } from "../services/fair-scheduler.service.js";
import type { Request, Response } from "express";

const pastedBodySchema = z.object({
  rows: z.string().min(1),
  chunkSize: z.number().int().positive().optional(),
});

export class BatchInputController {
  constructor(
    private readonly csvParser = new CsvParserService(),
    private readonly batchCreation = new BatchCreationService(),
    private readonly scheduler = new FairSchedulerService(),
  ) {}

  uploadCsv = async (req: Request, res: Response): Promise<void> => {
    const file = req.file;
    if (!file) {
      throw new Error("CSV file is required");
    }

    const rows = this.csvParser.parseUploadedCsv(file.buffer);
    const userId = req.authUser?.id ?? "demo-user";

    const batch = await this.batchCreation.createBatch({
      userId,
      sourceType: this.batchCreation.mapSourceType("CSV_UPLOAD"),
      rows,
      originalFileName: file.originalname,
      chunkSize: req.body?.chunkSize ? Number(req.body.chunkSize) : undefined,
    });

    await this.scheduler.refillQueue();

    res.status(201).json(batch);
  };

  pastedRows = async (req: Request, res: Response): Promise<void> => {
    const parsed = pastedBodySchema.parse(req.body);
    const rows = this.csvParser.parsePastedRows(parsed.rows);
    const userId = req.authUser?.id ?? "demo-user";

    const batch = await this.batchCreation.createBatch({
      userId,
      sourceType: this.batchCreation.mapSourceType("PASTED_ROWS"),
      rows,
      chunkSize: parsed.chunkSize,
    });

    await this.scheduler.refillQueue();

    res.status(201).json(batch);
  };
}
