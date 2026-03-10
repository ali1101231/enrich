import type { InputJsonValue } from "@prisma/client/runtime/library";
import { prisma } from "../lib/prisma.js";
import { AutoExportService } from "./auto-export.service.js";

const JOB_STATUS = {
  DISPATCHED: "DISPATCHED",
  RUNNING: "RUNNING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
} as const;

const BATCH_STATUS = {
  QUEUED: "QUEUED",
  RUNNING: "RUNNING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  PARTIAL: "PARTIAL",
} as const;

type BatchStatusValue = (typeof BATCH_STATUS)[keyof typeof BATCH_STATUS];

const JOB_RESULT_STATUS = {
  SUCCESS: "SUCCESS",
  FAILURE: "FAILURE",
} as const;

export class JobStateService {
  private readonly autoExport = new AutoExportService();

  async markRunning(jobId: string): Promise<boolean> {
    const updated = await prisma.job.updateMany({
      where: {
        id: jobId,
        status: JOB_STATUS.DISPATCHED,
      },
      data: {
        status: JOB_STATUS.RUNNING,
        startedAt: new Date(),
        attempts: {
          increment: 1,
        },
      },
    });

    if (updated.count === 1) {
      const batch = await prisma.job.findUnique({
        where: { id: jobId },
        select: { batchId: true },
      });
      if (batch) {
        await prisma.batch.updateMany({
          where: {
            id: batch.batchId,
            status: BATCH_STATUS.QUEUED,
          },
          data: {
            status: BATCH_STATUS.RUNNING,
            startedAt: new Date(),
          },
        });
      }
    }

    return updated.count === 1;
  }

  async markRetriable(jobId: string, errorMessage: string): Promise<void> {
    await prisma.job.updateMany({
      where: {
        id: jobId,
        status: JOB_STATUS.RUNNING,
      },
      data: {
        status: JOB_STATUS.DISPATCHED,
        errorMessage,
      },
    });
  }

  async markCompleted(jobId: string): Promise<void> {
    await prisma.job.updateMany({
      where: {
        id: jobId,
        status: JOB_STATUS.RUNNING,
      },
      data: {
        status: JOB_STATUS.COMPLETED,
        finishedAt: new Date(),
        errorMessage: null,
      },
    });

    await this.refreshBatchStateByJob(jobId);
  }

  async markFailed(jobId: string, errorMessage: string): Promise<void> {
    await prisma.job.updateMany({
      where: {
        id: jobId,
        status: {
          in: [JOB_STATUS.RUNNING, JOB_STATUS.DISPATCHED],
        },
      },
      data: {
        status: JOB_STATUS.FAILED,
        finishedAt: new Date(),
        errorMessage,
      },
    });

    await this.refreshBatchStateByJob(jobId);
  }

  async persistRowSuccess(
    jobId: string,
    attempt: number,
    rowIndex: number,
    response: Record<string, unknown>,
  ): Promise<void> {
    await prisma.jobResult.create({
      data: {
        jobId,
        status: JOB_RESULT_STATUS.SUCCESS,
        attempt,
        rowIndex,
        response: response as InputJsonValue,
      },
    });
  }

  async persistRowFailure(
    jobId: string,
    attempt: number,
    rowIndex: number | null,
    error: string,
  ): Promise<void> {
    await prisma.jobResult.create({
      data: {
        jobId,
        status: JOB_RESULT_STATUS.FAILURE,
        attempt,
        rowIndex,
        error,
      },
    });
  }

  private async refreshBatchStateByJob(jobId: string): Promise<void> {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { batchId: true },
    });

    if (!job) {
      return;
    }

    const batchJobs = await prisma.job.findMany({
      where: {
        batchId: job.batchId,
      },
      select: {
        status: true,
      },
    });

    const total = batchJobs.length;
    const completed = batchJobs.filter((item: { status: string }) => item.status === JOB_STATUS.COMPLETED).length;
    const failed = batchJobs.filter((item: { status: string }) => item.status === JOB_STATUS.FAILED).length;

    let status: BatchStatusValue = BATCH_STATUS.RUNNING;
    let completedAt: Date | null = null;

    if (total > 0 && completed === total) {
      status = BATCH_STATUS.COMPLETED;
      completedAt = new Date();
    } else if (total > 0 && failed === total) {
      status = BATCH_STATUS.FAILED;
      completedAt = new Date();
    } else if (total > 0 && completed + failed === total && failed > 0) {
      status = BATCH_STATUS.PARTIAL;
      completedAt = new Date();
    }

    await prisma.batch.update({
      where: { id: job.batchId },
      data: {
        status,
        completedAt,
      },
    });

    // Auto-export results when batch reaches terminal state
    if (status === BATCH_STATUS.COMPLETED || status === BATCH_STATUS.PARTIAL) {
      this.autoExport.exportIfReady(job.batchId).catch(() => {});
    }
  }
}
