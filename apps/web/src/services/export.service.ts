import { prisma } from "../prisma/client.js";
import { StorageService } from "./storage.service.js";
import { logInfo, logError } from "../lib/logger.js";

export class ExportService {
  constructor(private readonly storage = new StorageService()) {}

  /**
   * Collect all SUCCESS results for a batch, generate a CSV, upload to R2,
   * and persist the export record.
   */
  async exportBatchCsv(
    batchId: string,
    userId: string,
  ): Promise<{ exportId: string; fileName: string; rowCount: number }> {
    // Verify batch belongs to user
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      select: { id: true, userId: true, originalFileName: true },
    });

    if (!batch) {
      throw new Error("Batch not found");
    }
    if (batch.userId !== userId) {
      throw new Error("Access denied");
    }

    // Fetch all successful results ordered by job sequence + rowIndex
    const results = await prisma.jobResult.findMany({
      where: {
        job: { batchId },
        status: "SUCCESS",
      },
      select: {
        rowIndex: true,
        response: true,
        job: {
          select: { sequence: true },
        },
      },
      orderBy: [
        { job: { sequence: "asc" } },
        { rowIndex: "asc" },
      ],
    });

    if (results.length === 0) {
      throw new Error("No successful results to export");
    }

    // Build CSV
    const csvContent = this.buildCsv(results.map((r) => r.response as Record<string, unknown>));
    const csvBuffer = Buffer.from(csvContent, "utf-8");

    // Build R2 key
    const baseName = batch.originalFileName
      ? batch.originalFileName.replace(/\.csv$/i, "")
      : "batch";
    const safeBase = baseName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${safeBase}_results.csv`;
    const r2Key = `exports/${userId}/${batchId}/${fileName}`;

    // Upload to R2
    await this.storage.uploadBuffer(r2Key, csvBuffer, "text/csv");

    // Save export record
    const exportRecord = await prisma.batchExport.create({
      data: {
        batchId,
        userId,
        r2Key,
        fileName,
        rowCount: results.length,
        fileSize: csvBuffer.length,
      },
    });

    logInfo("CSV export created", {
      exportId: exportRecord.id,
      batchId,
      rowCount: results.length,
      fileSize: csvBuffer.length,
    });

    return {
      exportId: exportRecord.id,
      fileName,
      rowCount: results.length,
    };
  }

  async getExport(exportId: string, userId: string) {
    const exp = await prisma.batchExport.findUnique({
      where: { id: exportId },
    });
    if (!exp) throw new Error("Export not found");
    if (exp.userId !== userId) throw new Error("Access denied");
    return exp;
  }

  async listExportsForBatch(batchId: string, userId: string) {
    return prisma.batchExport.findMany({
      where: { batchId, userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fileName: true,
        rowCount: true,
        fileSize: true,
        createdAt: true,
      },
    });
  }

  async listUserExports(userId: string) {
    return prisma.batchExport.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        batchId: true,
        fileName: true,
        rowCount: true,
        fileSize: true,
        createdAt: true,
      },
    });
  }

  /** Admin: export any batch's results (no ownership check). */
  async adminExportBatchCsv(
    batchId: string,
    adminId: string,
  ): Promise<{ exportId: string; fileName: string; rowCount: number }> {
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      select: { id: true, userId: true, originalFileName: true },
    });

    if (!batch) {
      throw new Error("Batch not found");
    }

    const results = await prisma.jobResult.findMany({
      where: {
        job: { batchId },
        status: "SUCCESS",
      },
      select: {
        rowIndex: true,
        response: true,
        job: { select: { sequence: true } },
      },
      orderBy: [
        { job: { sequence: "asc" } },
        { rowIndex: "asc" },
      ],
    });

    if (results.length === 0) {
      throw new Error("No successful results to export");
    }

    const csvContent = this.buildCsv(results.map((r) => r.response as Record<string, unknown>));
    const csvBuffer = Buffer.from(csvContent, "utf-8");

    const baseName = batch.originalFileName
      ? batch.originalFileName.replace(/\.csv$/i, "")
      : "batch";
    const safeBase = baseName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${safeBase}_results.csv`;
    const r2Key = `exports/${adminId}/${batchId}/${fileName}`;

    await this.storage.uploadBuffer(r2Key, csvBuffer, "text/csv");

    const exportRecord = await prisma.batchExport.create({
      data: {
        batchId,
        userId: adminId,
        r2Key,
        fileName,
        rowCount: results.length,
        fileSize: csvBuffer.length,
      },
    });

    logInfo("Admin CSV export created", {
      exportId: exportRecord.id,
      batchId,
      adminId,
      rowCount: results.length,
      fileSize: csvBuffer.length,
    });

    return {
      exportId: exportRecord.id,
      fileName,
      rowCount: results.length,
    };
  }

  /** Admin: list all exports for a batch (any user). */
  async adminListExportsForBatch(batchId: string) {
    return prisma.batchExport.findMany({
      where: { batchId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fileName: true,
        rowCount: true,
        fileSize: true,
        createdAt: true,
      },
    });
  }

  async downloadExport(
    exportId: string,
    userId: string,
    isAdmin = false,
  ): Promise<{ buffer: Buffer; fileName: string; contentType: string }> {
    const exp = isAdmin
      ? await this.adminGetExport(exportId)
      : await this.getExport(exportId, userId);
    const buffer = await this.storage.getObject(exp.r2Key);
    return {
      buffer,
      fileName: exp.fileName,
      contentType: "text/csv",
    };
  }

  private async adminGetExport(exportId: string) {
    const exp = await prisma.batchExport.findUnique({
      where: { id: exportId },
    });
    if (!exp) throw new Error("Export not found");
    return exp;
  }

  private buildCsv(rows: Record<string, unknown>[]): string {
    if (rows.length === 0) return "";

    // Collect all unique keys across all rows for headers
    const keySet = new Set<string>();
    for (const row of rows) {
      if (row && typeof row === "object") {
        for (const key of Object.keys(row)) {
          keySet.add(key);
        }
      }
    }
    const headers = Array.from(keySet);

    const lines: string[] = [headers.map((h) => this.csvEscape(h)).join(",")];

    for (const row of rows) {
      const values = headers.map((h) => {
        const val = row?.[h];
        if (val === null || val === undefined) return "";
        if (typeof val === "object") return this.csvEscape(JSON.stringify(val));
        return this.csvEscape(String(val));
      });
      lines.push(values.join(","));
    }

    return lines.join("\n");
  }

  private csvEscape(value: string): string {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
