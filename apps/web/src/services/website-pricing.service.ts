import { Prisma, type WebsitePricingFeature } from "@prisma/client";
import { prisma } from "../prisma/client.js";

export class WebsitePricingServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "WebsitePricingServiceError";
  }
}

type PlanInclude = {
  include: {
    features: {
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }];
    };
  };
};

export type WebsitePricingPlanWithFeatures = Prisma.WebsitePricingPlanGetPayload<PlanInclude>;

type CreatePlanInput = {
  name: string;
  subtitle?: string | null;
  price: string;
  billingPeriod?: string | null;
  description?: string | null;
  ctaText?: string | null;
  ctaHref?: string | null;
  isPopular?: boolean;
  isActive?: boolean;
  sortOrder?: number;
};

type UpdatePlanInput = {
  name?: string;
  subtitle?: string | null;
  price?: string;
  billingPeriod?: string | null;
  description?: string | null;
  ctaText?: string | null;
  ctaHref?: string | null;
  isPopular?: boolean;
  isActive?: boolean;
  sortOrder?: number;
};

type CreateFeatureInput = {
  planId: string;
  text: string;
  isIncluded?: boolean;
  sortOrder?: number;
};

type UpdateFeatureInput = {
  text?: string;
  isIncluded?: boolean;
  sortOrder?: number;
};

const orderedFeaturesInclude = {
  features: {
    orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }],
  },
} as const;

function ensureRequiredText(value: string, fieldName: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new WebsitePricingServiceError(`${fieldName} is required`, 400);
  }
  return normalized;
}

function normalizeOptionalText(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalized = value.trim();
  if (!normalized) return null;
  return normalized;
}

function normalizeSortOrder(value: number | undefined): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isInteger(value) || value < 0) {
    throw new WebsitePricingServiceError("sortOrder must be a non-negative integer", 400);
  }
  return value;
}

function ensureId(id: string, fieldLabel: string): string {
  const normalized = id.trim();
  if (!normalized) {
    throw new WebsitePricingServiceError(`${fieldLabel} is required`, 400);
  }
  return normalized;
}

function ensureHasPlanUpdateFields(input: UpdatePlanInput): void {
  if (
    input.name === undefined &&
    input.subtitle === undefined &&
    input.price === undefined &&
    input.billingPeriod === undefined &&
    input.description === undefined &&
    input.ctaText === undefined &&
    input.ctaHref === undefined &&
    input.isPopular === undefined &&
    input.isActive === undefined &&
    input.sortOrder === undefined
  ) {
    throw new WebsitePricingServiceError("No fields provided for update", 400);
  }
}

function ensureHasFeatureUpdateFields(input: UpdateFeatureInput): void {
  if (input.text === undefined && input.isIncluded === undefined && input.sortOrder === undefined) {
    throw new WebsitePricingServiceError("No fields provided for update", 400);
  }
}

export class WebsitePricingService {
  async createPlan(input: CreatePlanInput): Promise<WebsitePricingPlanWithFeatures> {
    const plan = await prisma.websitePricingPlan.create({
      data: {
        name: ensureRequiredText(input.name, "plan name"),
        subtitle: normalizeOptionalText(input.subtitle) ?? null,
        price: ensureRequiredText(input.price, "price"),
        billingPeriod: normalizeOptionalText(input.billingPeriod) ?? null,
        description: normalizeOptionalText(input.description) ?? null,
        ctaText: normalizeOptionalText(input.ctaText) ?? null,
        ctaHref: normalizeOptionalText(input.ctaHref) ?? null,
        isPopular: input.isPopular ?? false,
        isActive: input.isActive ?? true,
        sortOrder: normalizeSortOrder(input.sortOrder) ?? 0,
      },
      include: orderedFeaturesInclude,
    });

    return plan;
  }

  async updatePlan(planId: string, input: UpdatePlanInput): Promise<WebsitePricingPlanWithFeatures> {
    const normalizedPlanId = ensureId(planId, "Plan id");
    ensureHasPlanUpdateFields(input);

    const existing = await prisma.websitePricingPlan.findUnique({ where: { id: normalizedPlanId }, select: { id: true } });
    if (!existing) {
      throw new WebsitePricingServiceError("Website pricing plan not found", 404);
    }

    return prisma.websitePricingPlan.update({
      where: { id: normalizedPlanId },
      data: {
        name: input.name === undefined ? undefined : ensureRequiredText(input.name, "plan name"),
        subtitle: normalizeOptionalText(input.subtitle),
        price: input.price === undefined ? undefined : ensureRequiredText(input.price, "price"),
        billingPeriod: normalizeOptionalText(input.billingPeriod),
        description: normalizeOptionalText(input.description),
        ctaText: normalizeOptionalText(input.ctaText),
        ctaHref: normalizeOptionalText(input.ctaHref),
        isPopular: input.isPopular,
        isActive: input.isActive,
        sortOrder: normalizeSortOrder(input.sortOrder),
      },
      include: orderedFeaturesInclude,
    });
  }

  async deletePlan(planId: string): Promise<void> {
    const normalizedPlanId = ensureId(planId, "Plan id");

    try {
      await prisma.websitePricingPlan.delete({ where: { id: normalizedPlanId } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new WebsitePricingServiceError("Website pricing plan not found", 404);
      }
      throw error;
    }
  }

  async listPlansAdmin(): Promise<WebsitePricingPlanWithFeatures[]> {
    return prisma.websitePricingPlan.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: orderedFeaturesInclude,
    });
  }

  async createFeature(input: CreateFeatureInput): Promise<WebsitePricingFeature> {
    const normalizedPlanId = ensureId(input.planId, "Plan id");

    const plan = await prisma.websitePricingPlan.findUnique({ where: { id: normalizedPlanId }, select: { id: true } });
    if (!plan) {
      throw new WebsitePricingServiceError("Website pricing plan not found", 404);
    }

    return prisma.websitePricingFeature.create({
      data: {
        planId: normalizedPlanId,
        text: ensureRequiredText(input.text, "feature text"),
        isIncluded: input.isIncluded ?? true,
        sortOrder: normalizeSortOrder(input.sortOrder) ?? 0,
      },
    });
  }

  async updateFeature(featureId: string, input: UpdateFeatureInput): Promise<WebsitePricingFeature> {
    const normalizedFeatureId = ensureId(featureId, "Feature id");
    ensureHasFeatureUpdateFields(input);

    const existing = await prisma.websitePricingFeature.findUnique({ where: { id: normalizedFeatureId }, select: { id: true } });
    if (!existing) {
      throw new WebsitePricingServiceError("Website pricing feature not found", 404);
    }

    return prisma.websitePricingFeature.update({
      where: { id: normalizedFeatureId },
      data: {
        text: input.text === undefined ? undefined : ensureRequiredText(input.text, "feature text"),
        isIncluded: input.isIncluded,
        sortOrder: normalizeSortOrder(input.sortOrder),
      },
    });
  }

  async deleteFeature(featureId: string): Promise<void> {
    const normalizedFeatureId = ensureId(featureId, "Feature id");

    try {
      await prisma.websitePricingFeature.delete({ where: { id: normalizedFeatureId } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new WebsitePricingServiceError("Website pricing feature not found", 404);
      }
      throw error;
    }
  }

  async listActivePlansPublic(): Promise<WebsitePricingPlanWithFeatures[]> {
    return prisma.websitePricingPlan.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: orderedFeaturesInclude,
    });
  }
}