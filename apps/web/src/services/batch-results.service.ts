import { prisma } from "../prisma/client.js";

export interface RowResult {
  jobId: string;
  rowIndex: number | null;
  status: string;
  response: unknown;
  error: string | null;
  createdAt: string;
}

export class BatchResultsService {
  async getResults(
    batchId: string,
    opts: { status?: "SUCCESS" | "FAILURE" | "SKIPPED"; limit?: number; offset?: number } = {},
  ): Promise<{ items: RowResult[]; total: number }> {
    const where: Record<string, unknown> = {
      job: { batchId },
    };
    if (opts.status) {
      where.status = opts.status;
    }

    const [items, total] = await Promise.all([
      prisma.jobResult.findMany({
        where,
        select: {
          jobId: true,
          rowIndex: true,
          status: true,
          response: true,
          error: true,
          createdAt: true,
        },
        orderBy: [{ jobId: "asc" }, { rowIndex: "asc" }],
        take: opts.limit ?? 200,
        skip: opts.offset ?? 0,
      }),
      prisma.jobResult.count({ where }),
    ]);

    return {
      items: items.map((r) => ({
        jobId: r.jobId,
        rowIndex: r.rowIndex,
        status: r.status,
        response: r.response,
        error: r.error,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
    };
  }

  async getCounts(batchId: string): Promise<{ success: number; failure: number; skipped: number; total: number }> {
    const [success, failure, skipped] = await Promise.all([
      prisma.jobResult.count({
        where: { job: { batchId }, status: "SUCCESS" },
      }),
      prisma.jobResult.count({
        where: { job: { batchId }, status: "FAILURE" },
      }),
      prisma.jobResult.count({
        where: { job: { batchId }, status: "SKIPPED" },
      }),
    ]);
    return { success, failure, skipped, total: success + failure + skipped };
  }
}
