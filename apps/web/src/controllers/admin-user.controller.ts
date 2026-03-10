import type { Request, Response } from "express";
import { prisma } from "../prisma/client.js";

export class AdminUserController {
  listUsers = async (_req: Request, res: Response): Promise<void> => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ items: users });
  };
}
