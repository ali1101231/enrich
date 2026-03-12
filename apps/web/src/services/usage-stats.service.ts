import { prisma } from "../prisma/client.js";

interface ToolCatalogItem {
  name: string;
  creditCost: number;
}

interface BatchUsageRecord {
  userId: string;
  toolId: string | null;
  totalRows: number;
  createdAt: Date;
}

interface ToolUsageItem {
  toolId: string;
  toolName: string;
  totalRows: number;
  totalBatches: number;
  creditsUsed: number;
}

interface DailyUsagePoint {
  date: string;
  creditsUsed: number;
  rowsProcessed: number;
}

export interface UserUsageSummary {
  user: {
    id: string;
    email: string;
    displayName: string | null;
    credits: number;
  };
  totals: {
    totalBatches: number;
    totalRows: number;
    creditsUsed: number;
  };
  toolUsage: ToolUsageItem[];
  dailyUsage: DailyUsagePoint[];
}

export interface AdminUserUsageSummary {
  userId: string;
  email: string;
  displayName: string | null;
  role: string;
  isActive: boolean;
  credits: number;
  totalBatches: number;
  totalRows: number;
  creditsUsed: number;
  toolUsage: ToolUsageItem[];
}

export interface AdminUsageSummary {
  totals: {
    totalUsers: number;
    activeUsers: number;
    totalBatches: number;
    totalRows: number;
    creditsUsed: number;
    currentCredits: number;
  };
  topTools: Array<
    ToolUsageItem & {
      activeUsers: number;
    }
  >;
  users: AdminUserUsageSummary[];
  dailyUsage: DailyUsagePoint[];
}

export class UsageStatsService {
  private readonly unknownToolId = "unspecified";

  async getUserUsage(userId: string): Promise<UserUsageSummary | null> {
    const [user, batches, toolCatalog] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, displayName: true, credits: true },
      }),
      prisma.batch.findMany({
        where: { userId },
        select: { userId: true, toolId: true, totalRows: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      this.getToolCatalog(),
    ]);

    if (!user) {
      return null;
    }

    const dailyUsage = this.createDailyUsageSeries(14);
    const toolUsageMap = new Map<string, ToolUsageItem>();

    let totalRows = 0;
    let creditsUsed = 0;

    for (const batch of batches) {
      const toolId = this.normalizeToolId(batch.toolId);
      const tool = this.resolveTool(toolId, toolCatalog);
      const batchCreditsUsed = batch.totalRows * tool.creditCost;

      totalRows += batch.totalRows;
      creditsUsed += batchCreditsUsed;

      const current = toolUsageMap.get(toolId);
      if (current) {
        current.totalRows += batch.totalRows;
        current.totalBatches += 1;
        current.creditsUsed += batchCreditsUsed;
      } else {
        toolUsageMap.set(toolId, {
          toolId,
          toolName: tool.name,
          totalRows: batch.totalRows,
          totalBatches: 1,
          creditsUsed: batchCreditsUsed,
        });
      }

      this.addToDailySeries(dailyUsage, batch.createdAt, batchCreditsUsed, batch.totalRows);
    }

    const toolUsage = Array.from(toolUsageMap.values()).sort((a, b) => b.creditsUsed - a.creditsUsed);

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        credits: user.credits,
      },
      totals: {
        totalBatches: batches.length,
        totalRows,
        creditsUsed,
      },
      toolUsage,
      dailyUsage,
    };
  }

  async getAdminUsage(): Promise<AdminUsageSummary> {
    const [users, batches, toolCatalog] = await Promise.all([
      prisma.user.findMany({
        where: { role: { not: "admin" } },
        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
          isActive: true,
          credits: true,
        },
      }),
      prisma.batch.findMany({
        select: { userId: true, toolId: true, totalRows: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      this.getToolCatalog(),
    ]);

    const userById = new Map(users.map((user) => [user.id, user]));
    const userUsageById = new Map<
      string,
      {
        totalBatches: number;
        totalRows: number;
        creditsUsed: number;
        tools: Map<string, ToolUsageItem>;
      }
    >();

    const topToolsMap = new Map<
      string,
      ToolUsageItem & {
        users: Set<string>;
      }
    >();

    const dailyUsage = this.createDailyUsageSeries(14);

    let totalRows = 0;
    let creditsUsed = 0;
    let totalBatches = 0;

    for (const batch of batches) {
      if (!userById.has(batch.userId)) {
        continue;
      }

      const toolId = this.normalizeToolId(batch.toolId);
      const tool = this.resolveTool(toolId, toolCatalog);
      const batchCreditsUsed = batch.totalRows * tool.creditCost;

      totalRows += batch.totalRows;
      creditsUsed += batchCreditsUsed;
      totalBatches += 1;

      let userUsage = userUsageById.get(batch.userId);
      if (!userUsage) {
        userUsage = {
          totalBatches: 0,
          totalRows: 0,
          creditsUsed: 0,
          tools: new Map<string, ToolUsageItem>(),
        };
        userUsageById.set(batch.userId, userUsage);
      }

      userUsage.totalBatches += 1;
      userUsage.totalRows += batch.totalRows;
      userUsage.creditsUsed += batchCreditsUsed;

      const userTool = userUsage.tools.get(toolId);
      if (userTool) {
        userTool.totalRows += batch.totalRows;
        userTool.totalBatches += 1;
        userTool.creditsUsed += batchCreditsUsed;
      } else {
        userUsage.tools.set(toolId, {
          toolId,
          toolName: tool.name,
          totalRows: batch.totalRows,
          totalBatches: 1,
          creditsUsed: batchCreditsUsed,
        });
      }

      const topTool = topToolsMap.get(toolId);
      if (topTool) {
        topTool.totalRows += batch.totalRows;
        topTool.totalBatches += 1;
        topTool.creditsUsed += batchCreditsUsed;
        topTool.users.add(batch.userId);
      } else {
        topToolsMap.set(toolId, {
          toolId,
          toolName: tool.name,
          totalRows: batch.totalRows,
          totalBatches: 1,
          creditsUsed: batchCreditsUsed,
          users: new Set([batch.userId]),
        });
      }

      this.addToDailySeries(dailyUsage, batch.createdAt, batchCreditsUsed, batch.totalRows);
    }

    const usersUsage: AdminUserUsageSummary[] = users
      .map((user) => {
        const usage = userUsageById.get(user.id);

        return {
          userId: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          isActive: user.isActive,
          credits: user.credits,
          totalBatches: usage?.totalBatches ?? 0,
          totalRows: usage?.totalRows ?? 0,
          creditsUsed: usage?.creditsUsed ?? 0,
          toolUsage: usage
            ? Array.from(usage.tools.values()).sort((a, b) => b.creditsUsed - a.creditsUsed)
            : [],
        };
      })
      .sort((a, b) => b.creditsUsed - a.creditsUsed);

    const topTools = Array.from(topToolsMap.values())
      .map((tool) => ({
        toolId: tool.toolId,
        toolName: tool.toolName,
        totalRows: tool.totalRows,
        totalBatches: tool.totalBatches,
        creditsUsed: tool.creditsUsed,
        activeUsers: tool.users.size,
      }))
      .sort((a, b) => b.creditsUsed - a.creditsUsed);

    return {
      totals: {
        totalUsers: users.length,
        activeUsers: users.filter((u) => u.isActive).length,
        totalBatches,
        totalRows,
        creditsUsed,
        currentCredits: users.reduce((sum, u) => sum + u.credits, 0),
      },
      topTools,
      users: usersUsage,
      dailyUsage,
    };
  }

  private async getToolCatalog(): Promise<Map<string, ToolCatalogItem>> {
    const rows = await prisma.tool.findMany({
      select: {
        toolId: true,
        name: true,
        creditCost: true,
      },
    });

    const catalog = new Map<string, ToolCatalogItem>();
    for (const row of rows) {
      catalog.set(row.toolId, {
        name: row.name,
        creditCost: row.creditCost,
      });
    }

    return catalog;
  }

  private normalizeToolId(toolId: string | null): string {
    const normalized = toolId?.trim();
    if (!normalized) {
      return this.unknownToolId;
    }
    return normalized;
  }

  private resolveTool(toolId: string, toolCatalog: Map<string, ToolCatalogItem>): ToolCatalogItem {
    if (toolId === this.unknownToolId) {
      return { name: "Unspecified Tool", creditCost: 1 };
    }

    const knownTool = toolCatalog.get(toolId);
    if (knownTool) {
      return knownTool;
    }

    return {
      name: this.toTitle(toolId),
      creditCost: 1,
    };
  }

  private createDailyUsageSeries(days: number): DailyUsagePoint[] {
    const points: DailyUsagePoint[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let index = days - 1; index >= 0; index -= 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - index);
      points.push({
        date: this.toDateKey(date),
        creditsUsed: 0,
        rowsProcessed: 0,
      });
    }

    return points;
  }

  private addToDailySeries(dailySeries: DailyUsagePoint[], createdAt: Date, creditsUsed: number, rowsProcessed: number): void {
    const dateKey = this.toDateKey(createdAt);
    const point = dailySeries.find((item) => item.date === dateKey);
    if (!point) {
      return;
    }

    point.creditsUsed += creditsUsed;
    point.rowsProcessed += rowsProcessed;
  }

  private toDateKey(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private toTitle(value: string): string {
    return value
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }
}