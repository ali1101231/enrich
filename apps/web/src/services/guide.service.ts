import { Prisma } from "@prisma/client";
import { prisma } from "../prisma/client.js";

export class GuideServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "GuideServiceError";
  }
}

export class GuideService {
  async create(input: {
    title: string;
    content: string;
    videoUrl?: string;
    isActive?: boolean;
    createdById?: string;
  }) {
    return prisma.guide.create({
      data: {
        title: input.title,
        content: input.content,
        videoUrl: input.videoUrl ?? null,
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
    return prisma.guide.findMany({
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
      videoUrl?: string | null;
      isActive?: boolean;
    },
  ) {
    const existing = await prisma.guide.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      throw new GuideServiceError("Guide not found", 404);
    }

    return prisma.guide.update({
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
      await prisma.guide.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new GuideServiceError("Guide not found", 404);
      }
      throw error;
    }
  }

  async listActive() {
    return prisma.guide.findMany({
      where: { isActive: true },
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
}
