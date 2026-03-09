import { BatchSourceType, BatchStatus, JobStatus } from "@prisma/client";
import { env } from "../lib/env.js";
import { logInfo } from "../lib/logger.js";
import { prisma } from "../prisma/client.js";
import { ApiKeyAssignmentService } from "./api-key-assignment.service.js";
import { JobChunkingService } from "./job-chunking.service.js";
import type { ParsedRow } from "./csv-parser.service.js";

export class BatchCreationService {
  constructor(
    private readonly keyAssignmentService = new ApiKeyAssignmentService(),
    private readonly chunkingService = new JobChunkingService(),
  ) {}

  async createBatch(input: {
    userId: string;
    sourceType: BatchSourceType;
    rows: ParsedRow[];
    originalFileName?: string;
    chunkSize?: number;
  }): Promise<{ batchId: string; totalRows: number; totalJobs: number }> {
    if (input.rows.length === 0) {
      throw new Error("Input rows are empty");
    }

    await this.keyAssignmentService.autoAssignLeastLoadedKey(input.userId);

    const chunkSize = input.chunkSize ?? env.CHUNK_SIZE_DEFAULT;
    const chunks = this.chunkingService.chunkRows(input.rows, chunkSize);

    const result = await prisma.$transaction(async (tx) => {
      await tx.user.upsert({
        where: { id: input.userId },
        update: {},
        create: {
          id: input.userId,
          email: `${input.userId}@local.invalid`,
        },
      });

      const batch = await tx.batch.create({
        data: {
          userId: input.userId,
          sourceType: input.sourceType,
          originalFileName: input.originalFileName,
          totalRows: input.rows.length,
          chunkSize,
          status: BatchStatus.QUEUED,
        },
        select: {
          id: true,
        },
      });

      for (const chunk of chunks) {
        await tx.job.create({
          data: {
            batchId: batch.id,
            userId: input.userId,
            sequence: chunk.sequence,
            rowCount: chunk.rowCount,
            payload: chunk.payload,
            maxAttempts: env.JOB_MAX_ATTEMPTS,
            status: JobStatus.QUEUED,
          },
        });
      }

      return {
        batchId: batch.id,
      };
    });

    logInfo("Batch created", {
      batchId: result.batchId,
      totalRows: input.rows.length,
      totalJobs: chunks.length,
      sourceType: input.sourceType,
    });

    return {
      batchId: result.batchId,
      totalRows: input.rows.length,
      totalJobs: chunks.length,
    };
  }

  mapSourceType(sourceType: "CSV_UPLOAD" | "PASTED_ROWS"): BatchSourceType {
    return sourceType === "CSV_UPLOAD" ? BatchSourceType.CSV_UPLOAD : BatchSourceType.PASTED_ROWS;
  }
}
