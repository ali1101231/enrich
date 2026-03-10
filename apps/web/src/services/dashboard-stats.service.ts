import { prisma } from "../prisma/client.js";

export interface DashboardStats {
  totalBatches: number;
  activeBatches: number;
  completedBatches: number;
  failedBatches: number;
  totalRowsProcessed: number;
  totalRowsFailed: number;
  totalExports: number;
  batchesToday: number;
}

export class DashboardStatsService {
  async getStats(userId: string): Promise<DashboardStats> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalBatches,
      activeBatches,
      completedBatches,
      failedBatches,
      batchesToday,
      totalExports,
      rowAggregates,
    ] = await Promise.all([
      prisma.batch.count({ where: { userId } }),
      prisma.batch.count({
        where: { userId, status: { in: ["QUEUED", "RUNNING"] } },
      }),
      prisma.batch.count({
        where: { userId, status: "COMPLETED" },
      }),
      prisma.batch.count({
        where: { userId, status: { in: ["FAILED", "PARTIAL"] } },
      }),
      prisma.batch.count({
        where: { userId, createdAt: { gte: todayStart } },
      }),
      prisma.batchExport.count({ where: { userId } }),
      prisma.jobResult.groupBy({
        by: ["status"],
        where: { job: { userId } },
        _count: true,
      }),
    ]);

    let totalRowsProcessed = 0;
    let totalRowsFailed = 0;
    for (const agg of rowAggregates) {
      if (agg.status === "SUCCESS") totalRowsProcessed = agg._count;
      if (agg.status === "FAILURE") totalRowsFailed = agg._count;
    }

    return {
      totalBatches,
      activeBatches,
      completedBatches,
      failedBatches,
      totalRowsProcessed,
      totalRowsFailed,
      totalExports,
      batchesToday,
    };
  }
}
