import { JobStatus } from "@prisma/client";
import { prisma } from "../prisma/client.js";

export class RunHistoryService {
  async listRuns(userId: string, limit = 20): Promise<
    Array<{
      batchId: string;
      createdAt: Date;
      sourceType: string;
      totalRows: number;
      status: string;
      completedRows: number;
      failedRows: number;
    }>
  > {
    const batches = await prisma.batch.findMany({
      where: {
        userId,
      },
      include: {
        jobs: {
          select: {
            status: true,
            rowCount: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return batches.map((batch) => {
      let completedRows = 0;
      let failedRows = 0;

      for (const job of batch.jobs) {
        if (job.status === JobStatus.COMPLETED) {
          completedRows += job.rowCount;
        }
        if (job.status === JobStatus.FAILED) {
          failedRows += job.rowCount;
        }
      }

      return {
        batchId: batch.id,
        createdAt: batch.createdAt,
        sourceType: batch.sourceType,
        totalRows: batch.totalRows,
        status: batch.status,
        completedRows,
        failedRows,
      };
    });
  }
}
