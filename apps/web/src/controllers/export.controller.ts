import type { Request, Response } from "express";
import { ExportService } from "../services/export.service.js";
import { verifyToken } from "../lib/jwt.js";

export class ExportController {
  constructor(private readonly exportService = new ExportService()) {}

  exportBatchCsv = async (req: Request, res: Response): Promise<void> => {
    const userId = req.authUser!.id;
    const batchId = req.params.batchId;
    const result = await this.exportService.exportBatchCsv(batchId, userId);
    res.status(201).json(result);
  };

  listExports = async (req: Request, res: Response): Promise<void> => {
    const userId = req.authUser!.id;
    const batchId = req.params.batchId;
    const items = await this.exportService.listExportsForBatch(batchId, userId);
    res.status(200).json({ items });
  };

  listUserExports = async (req: Request, res: Response): Promise<void> => {
    const userId = req.authUser!.id;
    const items = await this.exportService.listUserExports(userId);
    res.status(200).json({ items });
  };

  /**
   * Download supports both Bearer header and ?token= query param
   * to allow direct browser links (e.g. <a href="...">) without JS fetch.
   */
  downloadExport = async (req: Request, res: Response): Promise<void> => {
    let userId = req.authUser?.id;

    // Fall back to query-param token for direct download links
    if (!userId && typeof req.query.token === "string") {
      try {
        const payload = verifyToken(req.query.token);
        userId = payload.userId;
      } catch {
        res.status(401).json({ error: "Invalid token" });
        return;
      }
    }

    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const exportId = req.params.exportId;
    const { buffer, fileName, contentType } = await this.exportService.downloadExport(
      exportId,
      userId,
    );
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Length", buffer.length);
    res.status(200).end(buffer);
  };
}
