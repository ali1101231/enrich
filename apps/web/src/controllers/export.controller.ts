import type { Request, Response } from "express";
import { z } from "zod";
import { ExportService } from "../services/export.service.js";
import { verifyToken } from "../lib/jwt.js";

const bulkDeleteSchema = z.object({
  exportIds: z.array(z.string()).min(1).max(100),
});

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

  deleteExport = async (req: Request, res: Response): Promise<void> => {
    const userId = req.authUser!.id;
    const exportId = req.params.exportId;
    await this.exportService.deleteExport(exportId, userId);
    res.status(204).end();
  };

  bulkDeleteExports = async (req: Request, res: Response): Promise<void> => {
    const userId = req.authUser!.id;
    const { exportIds } = bulkDeleteSchema.parse(req.body);
    const deleted = await this.exportService.bulkDeleteExports(exportIds, userId);
    res.status(200).json({ deleted });
  };

  /**
   * Download supports both Bearer header and ?token= query param
   * to allow direct browser links (e.g. <a href="...">) without JS fetch.
   */
  downloadExport = async (req: Request, res: Response): Promise<void> => {
    let userId = req.authUser?.id;
    let role = req.authUser?.role;

    // Fall back to query-param token for direct download links
    if (!userId && typeof req.query.token === "string") {
      try {
        const payload = verifyToken(req.query.token);
        userId = payload.userId;
        role = payload.role as "user" | "admin";
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
    const isAdmin = role === "admin";
    const { buffer, fileName, contentType } = await this.exportService.downloadExport(
      exportId,
      userId,
      isAdmin,
    );
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Length", buffer.length);
    res.status(200).end(buffer);
  };
}
