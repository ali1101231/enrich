import { z } from "zod";
import { CsvParserService } from "../services/csv-parser.service.js";
import { BatchCreationService } from "../services/batch-creation.service.js";
import { StorageService } from "../services/storage.service.js";
import { CreditService, CreditError } from "../services/credit.service.js";
import { logError } from "../lib/logger.js";
import type { Request, Response } from "express";

const pastedBodySchema = z.object({
  rows: z.string().min(1),
  chunkSize: z.number().int().positive().optional(),
  toolId: z.string().optional(),
});

export class BatchInputController {
  constructor(
    private readonly csvParser = new CsvParserService(),
    private readonly batchCreation = new BatchCreationService(),
    private readonly storage = new StorageService(),
    private readonly creditService = new CreditService(),
  ) {}

  uploadCsv = async (req: Request, res: Response): Promise<void> => {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "CSV file is required" });
      return;
    }

    const rows = this.csvParser.parseUploadedCsv(file.buffer);
    if (rows.length === 0) {
      res.status(400).json({ error: "CSV file contains no data rows" });
      return;
    }

    const userId = req.authUser?.id ?? "demo-user";
    const chunkSize = req.body?.chunkSize ? Number(req.body.chunkSize) : undefined;
    const toolId = typeof req.body?.toolId === "string" ? req.body.toolId : undefined;

    // Deduct credits: 1 credit per row
    try {
      await this.creditService.deduct(userId, rows.length);
    } catch (err) {
      if (err instanceof CreditError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      throw err;
    }

    // Create batch first to get the batchId for the R2 key
    const batch = await this.batchCreation.createBatch({
      userId,
      sourceType: this.batchCreation.mapSourceType("CSV_UPLOAD"),
      rows,
      originalFileName: file.originalname,
      chunkSize,
      toolId,
    });

    // Upload original file to R2 (non-blocking for response, but we await it)
    try {
      const r2Key = this.storage.buildUploadKey(userId, batch.batchId, file.originalname);
      await this.storage.uploadBuffer(r2Key, file.buffer, "text/csv");
      await this.batchCreation.setR2Key(batch.batchId, r2Key);
    } catch (err) {
      // R2 upload failure is non-fatal; batch and jobs are already created
      logError("R2 upload failed for batch", {
        batchId: batch.batchId,
        message: err instanceof Error ? err.message : "unknown",
      });
    }

    res.status(201).json(batch);
  };

  pastedRows = async (req: Request, res: Response): Promise<void> => {
    const parsed = pastedBodySchema.parse(req.body);
    const rows = this.csvParser.parsePastedRows(parsed.rows);
    if (rows.length === 0) {
      res.status(400).json({ error: "No valid rows found in pasted input" });
      return;
    }

    const userId = req.authUser?.id ?? "demo-user";

    // Deduct credits: 1 credit per row
    try {
      await this.creditService.deduct(userId, rows.length);
    } catch (err) {
      if (err instanceof CreditError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      throw err;
    }

    const batch = await this.batchCreation.createBatch({
      userId,
      sourceType: this.batchCreation.mapSourceType("PASTED_ROWS"),
      rows,
      chunkSize: parsed.chunkSize,
      toolId: parsed.toolId,
    });

    res.status(201).json(batch);
  };
}
