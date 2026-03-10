import { JobStatus } from "@prisma/client";
import { estimateRemainingSeconds, toPercentage, type BatchProgressResponse } from "@koldify/shared";
import { prisma } from "../prisma/client.js";

export class BatchProgressService {
  async getBatchProgress(batchId: string): Promise<BatchProgressResponse> {
    const batch = await prisma.batch.findUnique({
      where: {
        id: batchId,
      },
      include: {
        jobs: {
          select: {
            status: true,
            rowCount: true,
          },
        },
      },
    });

    if (!batch) {
      throw new Error("Batch not found");
    }

    const totals = {
      totalRows: batch.totalRows,
      queuedRows: 0,
      runningRows: 0,
      completedRows: 0,
      failedRows: 0,
    };

    for (const job of batch.jobs) {
      if (job.status === JobStatus.QUEUED || job.status === JobStatus.DISPATCHED) {
        totals.queuedRows += job.rowCount;
      } else if (job.status === JobStatus.RUNNING) {
        totals.runningRows += job.rowCount;
      } else if (job.status === JobStatus.COMPLETED) {
        totals.completedRows += job.rowCount;
      } else if (job.status === JobStatus.FAILED) {
        totals.failedRows += job.rowCount;
      }
    }

    return {
      batchId,
      status: batch.status,
      totalRows: totals.totalRows,
      queuedRows: totals.queuedRows,
      runningRows: totals.runningRows,
      completedRows: totals.completedRows,
      failedRows: totals.failedRows,
      percentageComplete: toPercentage(totals.completedRows + totals.failedRows, totals.totalRows),
      estimatedRemainingSeconds: estimateRemainingSeconds(
        totals.completedRows + totals.failedRows,
        totals.totalRows,
        batch.createdAt,
      ),
    };
  }

  async getBatchById(batchId: string) {
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      select: {
        id: true,
        userId: true,
        sourceType: true,
        originalFileName: true,
        totalRows: true,
        chunkSize: true,
        status: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
      },
    });
    return batch;
  }

  async listUserBatches(userId: string, limit = 50) {
    const batches = await prisma.batch.findMany({
      where: { userId },
      include: {
        jobs: {
          select: { status: true, rowCount: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return batches.map((batch) => {
      let completedRows = 0;
      let failedRows = 0;
      let runningRows = 0;
      let queuedRows = 0;

      for (const job of batch.jobs) {
        if (job.status === JobStatus.QUEUED || job.status === JobStatus.DISPATCHED) {
          queuedRows += job.rowCount;
        } else if (job.status === JobStatus.RUNNING) {
          runningRows += job.rowCount;
        } else if (job.status === JobStatus.COMPLETED) {
          completedRows += job.rowCount;
        } else if (job.status === JobStatus.FAILED) {
          failedRows += job.rowCount;
        }
      }

      return {
        id: batch.id,
        sourceType: batch.sourceType,
        originalFileName: batch.originalFileName,
        totalRows: batch.totalRows,
        status: batch.status,
        completedRows,
        failedRows,
        runningRows,
        queuedRows,
        createdAt: batch.createdAt.toISOString(),
      };
    });
  }

  async listJobsForBatch(batchId: string) {
    const jobs = await prisma.job.findMany({
      where: { batchId },
      select: {
        id: true,
        sequence: true,
        rowCount: true,
        status: true,
        attempts: true,
        maxAttempts: true,
        queuedAt: true,
        startedAt: true,
        finishedAt: true,
        errorMessage: true,
        createdAt: true,
      },
      orderBy: { sequence: "asc" },
    });
    return jobs;
  }
}
