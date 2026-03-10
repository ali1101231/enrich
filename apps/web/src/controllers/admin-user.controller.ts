import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma/client.js";

const updateRoleSchema = z.object({
  role: z.enum(["user", "admin"]),
});

const updateCreditsSchema = z.object({
  credits: z.number().int().min(0),
});

export class AdminUserController {
  listUsers = async (_req: Request, res: Response): Promise<void> => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        isActive: true,
        credits: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ items: users });
  };

  getUserDetail = async (req: Request, res: Response): Promise<void> => {
    const userId = req.params.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        isActive: true,
        credits: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Gather stats
    const [
      totalBatches,
      batchStatusCounts,
      totalRowsProcessed,
      totalExports,
      assignments,
    ] = await Promise.all([
      prisma.batch.count({ where: { userId } }),
      prisma.batch.groupBy({
        by: ["status"],
        where: { userId },
        _count: true,
      }),
      prisma.jobResult.count({
        where: { job: { userId }, status: "SUCCESS" },
      }),
      prisma.batchExport.count({ where: { userId } }),
      prisma.apiKeyAssignment.findMany({
        where: { userId, isActive: true },
        select: {
          id: true,
          apiKeyId: true,
          isManual: true,
          createdAt: true,
          apiKey: {
            select: {
              id: true,
              label: true,
              isActive: true,
              requestsPerSecond: true,
            },
          },
        },
      }),
    ]);

    const statusMap: Record<string, number> = {};
    for (const s of batchStatusCounts) {
      statusMap[s.status] = s._count;
    }

    // Recent batches for this user
    const recentBatches = await prisma.batch.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        toolId: true,
        sourceType: true,
        originalFileName: true,
        totalRows: true,
        status: true,
        createdAt: true,
      },
    });

    res.status(200).json({
      user,
      stats: {
        totalBatches,
        completedBatches: statusMap["COMPLETED"] ?? 0,
        activeBatches: (statusMap["QUEUED"] ?? 0) + (statusMap["RUNNING"] ?? 0),
        failedBatches: statusMap["FAILED"] ?? 0,
        totalRowsProcessed,
        totalExports,
      },
      assignments,
      recentBatches,
    });
  };

  updateUserRole = async (req: Request, res: Response): Promise<void> => {
    const userId = req.params.userId;
    const adminId = req.authUser!.id;

    // Prevent admin from demoting themselves
    if (userId === adminId) {
      res.status(400).json({ error: "Cannot change your own role" });
      return;
    }

    const body = updateRoleSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role: body.role },
    });

    res.status(200).json({ message: `User role updated to ${body.role}` });
  };

  deleteUser = async (req: Request, res: Response): Promise<void> => {
    const userId = req.params.userId;
    const adminId = req.authUser!.id;

    // Prevent admin from deleting themselves
    if (userId === adminId) {
      res.status(400).json({ error: "Cannot delete your own account" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Cascade deletes are set up in Prisma schema
    await prisma.user.delete({ where: { id: userId } });

    res.status(200).json({ message: "User deleted" });
  };

  updateCredits = async (req: Request, res: Response): Promise<void> => {
    const userId = req.params.userId;
    const body = updateCreditsSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { credits: body.credits },
    });

    res.status(200).json({ message: `Credits updated to ${body.credits}`, credits: body.credits });
  };
}
