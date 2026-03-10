import { MAX_USERS_PER_API_KEY } from "@koldify/shared";
import { prisma } from "../prisma/client.js";

type ApiKeyListItem = {
  id: string;
  label: string;
  isActive: boolean;
  maxUsers: number;
  createdAt: Date;
  _count: {
    assignments: number;
  };
};

type AssignmentListItem = {
  id: string;
  userId: string;
  apiKeyId: string;
  isManual: boolean;
  isActive: boolean;
  createdAt: Date;
  apiKey: {
    label: string;
    isActive: boolean;
  };
  user: {
    email: string;
  };
};

type ActiveKeyLoadItem = {
  id: string;
  maxUsers: number;
  _count: {
    assignments: number;
  };
};

export class ApiKeyAssignmentService {
  async createApiKey(input: { label: string; rawKey: string }): Promise<{ id: string }> {
    const created = await prisma.apiKey.create({
      data: {
        label: input.label,
        encryptedKey: input.rawKey,
        maxUsers: MAX_USERS_PER_API_KEY,
        requestsPerSecond: 5,
      },
      select: {
        id: true,
      },
    });
    return created;
  }

  async listApiKeys(): Promise<
    Array<{ id: string; label: string; isActive: boolean; activeUsers: number; maxUsers: number; createdAt: Date }>
  > {
    const keys = (await prisma.apiKey.findMany({
      include: {
        _count: {
          select: {
            assignments: {
              where: {
                isActive: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })) as ApiKeyListItem[];

    return keys.map((item: ApiKeyListItem) => ({
      id: item.id,
      label: item.label,
      isActive: item.isActive,
      maxUsers: item.maxUsers,
      activeUsers: item._count.assignments,
      createdAt: item.createdAt,
    }));
  }

  async setApiKeyActiveStatus(apiKeyId: string, isActive: boolean): Promise<void> {
    await prisma.apiKey.update({
      where: { id: apiKeyId },
      data: { isActive },
    });
  }

  async listAssignments(userId?: string): Promise<
    Array<{
      id: string;
      userId: string;
      userEmail: string;
      apiKeyId: string;
      isManual: boolean;
      isActive: boolean;
      createdAt: Date;
      apiKeyLabel: string;
      apiKeyActive: boolean;
    }>
  > {
    const assignments = (await prisma.apiKeyAssignment.findMany({
      where: {
        ...(userId ? { userId } : {}),
      },
      include: {
        apiKey: {
          select: {
            label: true,
            isActive: true,
          },
        },
        user: {
          select: {
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })) as AssignmentListItem[];

    return assignments.map((assignment: AssignmentListItem) => ({
      id: assignment.id,
      userId: assignment.userId,
      userEmail: assignment.user.email,
      apiKeyId: assignment.apiKeyId,
      isManual: assignment.isManual,
      isActive: assignment.isActive,
      createdAt: assignment.createdAt,
      apiKeyLabel: assignment.apiKey.label,
      apiKeyActive: assignment.apiKey.isActive,
    }));
  }

  async getActiveAssignment(userId: string): Promise<{ apiKeyId: string } | null> {
    const assignment = await prisma.apiKeyAssignment.findFirst({
      where: {
        userId,
        isActive: true,
        apiKey: {
          isActive: true,
        },
      },
      select: {
        apiKeyId: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return assignment;
  }

  async manualAssignUserToKey(userId: string, apiKeyId: string): Promise<void> {
    await this.ensureUser(userId);
    await this.assertApiKeyHasCapacity(apiKeyId);
    await this.assignUser(userId, apiKeyId, true);
  }

  async autoAssignLeastLoadedKey(userId: string): Promise<{ apiKeyId: string }> {
    await this.ensureUser(userId);

    const existing = await this.getActiveAssignment(userId);
    if (existing) {
      return existing;
    }

    const activeKeys = (await prisma.apiKey.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            assignments: {
              where: {
                isActive: true,
              },
            },
          },
        },
      },
    })) as ActiveKeyLoadItem[];

    const sortedByLoad = activeKeys
      .map((key: ActiveKeyLoadItem) => ({
        id: key.id,
        activeUsers: key._count.assignments,
        maxUsers: key.maxUsers,
      }))
      .filter((key: { activeUsers: number; maxUsers: number }) => key.activeUsers < key.maxUsers)
      .sort(
        (a: { activeUsers: number }, b: { activeUsers: number }) =>
          a.activeUsers - b.activeUsers,
      );

    const chosen = sortedByLoad[0];
    if (!chosen) {
      throw new Error("No active Blitz API key with available capacity");
    }

    await this.assignUser(userId, chosen.id, false);
    return { apiKeyId: chosen.id };
  }

  async deactivateAssignment(assignmentId: string): Promise<void> {
    const updated = await prisma.apiKeyAssignment.updateMany({
      where: { id: assignmentId, isActive: true },
      data: { isActive: false },
    });
    if (updated.count === 0) {
      throw new Error("Assignment not found or already inactive");
    }
  }

  async deactivateUserAssignments(userId: string): Promise<number> {
    const result = await prisma.apiKeyAssignment.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });
    return result.count;
  }

  private async ensureUser(userId: string): Promise<void> {
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: `${userId}@local.invalid`,
      },
    });
  }

  private async assertApiKeyHasCapacity(apiKeyId: string): Promise<void> {
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: apiKeyId },
      select: {
        id: true,
        isActive: true,
        maxUsers: true,
      },
    });

    if (!apiKey || !apiKey.isActive) {
      throw new Error("API key is not active or does not exist");
    }

    const activeUsers = await prisma.apiKeyAssignment.count({
      where: {
        apiKeyId,
        isActive: true,
      },
    });

    if (activeUsers >= apiKey.maxUsers) {
      throw new Error("API key is already at maximum user capacity");
    }
  }

  private async assignUser(userId: string, apiKeyId: string, isManual: boolean): Promise<void> {
    await prisma.$transaction([
      prisma.apiKeyAssignment.updateMany({
        where: {
          userId,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      }),
      prisma.apiKeyAssignment.create({
        data: {
          userId,
          apiKeyId,
          isManual,
          isActive: true,
        },
      }),
    ]);
  }
}
