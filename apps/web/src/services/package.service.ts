import { prisma } from "../prisma/client.js";

export class PackageService {
  async create(input: {
    name: string;
    credits: number;
    monthlyPrice: number;
    yearlyPrice: number;
    isTopLevel?: boolean;
    isHighlighted?: boolean;
    badge?: string;
    subtitle?: string;
    buttonText?: string;
    features?: string[];
    sortOrder?: number;
  }) {
    return prisma.package.create({
      data: {
        name: input.name,
        credits: input.credits,
        monthlyPrice: input.monthlyPrice,
        yearlyPrice: input.yearlyPrice,
        isTopLevel: input.isTopLevel ?? false,
        isHighlighted: input.isHighlighted ?? false,
        badge: input.badge ?? null,
        subtitle: input.subtitle ?? null,
        buttonText: input.buttonText ?? "Get Started",
        features: input.features ?? [],
        sortOrder: input.sortOrder ?? 0,
      },
    });
  }

  async list() {
    return prisma.package.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
  }

  async listActive() {
    return prisma.package.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
  }

  async getById(id: string) {
    return prisma.package.findUnique({ where: { id } });
  }

  async update(
    id: string,
    input: {
      name?: string;
      credits?: number;
      monthlyPrice?: number;
      yearlyPrice?: number;
      isTopLevel?: boolean;
      isActive?: boolean;
      isHighlighted?: boolean;
      badge?: string | null;
      subtitle?: string | null;
      buttonText?: string;
      features?: string[];
      sortOrder?: number;
    },
  ) {
    return prisma.package.update({
      where: { id },
      data: input,
    });
  }

  async remove(id: string) {
    return prisma.package.delete({ where: { id } });
  }
}
