import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import type { InputJsonValue } from "@prisma/client/runtime/library";
import { env } from "../lib/env.js";
import { prisma } from "../lib/prisma.js";
import { logInfo, logError } from "../lib/logger.js";

const s3 = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

export class AutoExportService {
  /**
   * Automatically export successful results when a batch finishes.
   * Skips silently if no results or an export already exists.
   */
  async exportIfReady(batchId: string): Promise<void> {
    try {
      const existing = await prisma.batchExport.findFirst({ where: { batchId } });
      if (existing) return;

      const batch = await prisma.batch.findUnique({
        where: { id: batchId },
        select: { id: true, userId: true, originalFileName: true },
      });
      if (!batch) return;

      const results = await prisma.jobResult.findMany({
        where: { job: { batchId }, status: "SUCCESS" },
        select: { response: true, job: { select: { sequence: true } }, rowIndex: true },
        orderBy: [{ job: { sequence: "asc" } }, { rowIndex: "asc" }],
      });

      if (results.length === 0) return;

      const rows = results.map((r) => r.response as Record<string, unknown>);
      const csvContent = this.buildCsv(rows);
      const csvBuffer = Buffer.from(csvContent, "utf-8");

      const baseName = batch.originalFileName
        ? batch.originalFileName.replace(/\.csv$/i, "")
        : "batch";
      const safeBase = baseName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileName = `${safeBase}_results.csv`;
      const r2Key = `exports/${batch.userId}/${batchId}/${fileName}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: env.R2_BUCKET_NAME,
          Key: r2Key,
          Body: csvBuffer,
          ContentType: "text/csv",
        }),
      );

      await prisma.batchExport.create({
        data: {
          batchId,
          userId: batch.userId,
          r2Key,
          fileName,
          rowCount: results.length,
          fileSize: csvBuffer.length,
        },
      });

      logInfo("Auto-export completed", { batchId, fileName, rowCount: results.length });
    } catch (err) {
      logError("Auto-export failed", {
        batchId,
        message: err instanceof Error ? err.message : "unknown",
      });
    }
  }

  private buildCsv(rows: Record<string, unknown>[]): string {
    if (rows.length === 0) return "";
    const keySet = new Set<string>();
    for (const row of rows) {
      if (row && typeof row === "object") {
        for (const key of Object.keys(row)) keySet.add(key);
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
