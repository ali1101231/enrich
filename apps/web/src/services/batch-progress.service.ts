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
      if (job.status === JobStatus.QUEUED || job.status === JobStatus.QUEUED_FOR_WORKER) {
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
}
