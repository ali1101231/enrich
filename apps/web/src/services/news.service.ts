import { Prisma } from "@prisma/client";
import { prisma } from "../prisma/client.js";

export class NewsServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "NewsServiceError";
  }
}

export class NewsService {
  async create(input: {
    title: string;
    content: string;
    isActive?: boolean;
    createdById?: string;
  }) {
    return prisma.news.create({
      data: {
        title: input.title,
        content: input.content,
        isActive: input.isActive ?? true,
        createdById: input.createdById,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });
  }

  async listAdmin() {
    return prisma.news.findMany({
      orderBy: [{ updatedAt: "desc" }],
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });
  }

  async update(
    id: string,
    input: {
      title?: string;
      content?: string;
      isActive?: boolean;
    },
  ) {
    const existing = await prisma.news.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      throw new NewsServiceError("News not found", 404);
    }

    return prisma.news.update({
      where: { id },
      data: input,
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    try {
      await prisma.news.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NewsServiceError("News not found", 404);
      }
      throw error;
    }
  }

  async listActive() {
    return prisma.news.findMany({
      where: { isActive: true },
      orderBy: [{ createdAt: "desc" }],
      include: {
        createdBy: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });
  }
}
