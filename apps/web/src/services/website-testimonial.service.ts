import { Prisma, type WebsiteTestimonial } from "@prisma/client";
import { prisma } from "../prisma/client.js";

export class WebsiteTestimonialServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "WebsiteTestimonialServiceError";
  }
}

type CreateTestimonialInput = {
  clientName: string;
  clientRole?: string | null;
  companyName?: string | null;
  quote: string;
  avatarUrl?: string | null;
  rating?: number | null;
  isActive?: boolean;
  sortOrder?: number;
};

type UpdateTestimonialInput = {
  clientName?: string;
  clientRole?: string | null;
  companyName?: string | null;
  quote?: string;
  avatarUrl?: string | null;
  rating?: number | null;
  isActive?: boolean;
  sortOrder?: number;
};

function ensureRequiredText(value: string, fieldName: string, maxLength: number): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new WebsiteTestimonialServiceError(`${fieldName} is required`, 400);
  }
  if (normalized.length > maxLength) {
    throw new WebsiteTestimonialServiceError(`${fieldName} must be at most ${maxLength} characters`, 400);
  }
  return normalized;
}

function normalizeOptionalText(
  value: string | null | undefined,
  fieldName: string,
  maxLength: number,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > maxLength) {
    throw new WebsiteTestimonialServiceError(`${fieldName} must be at most ${maxLength} characters`, 400);
  }
  return normalized;
}

function normalizeSortOrder(value: number | undefined): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isInteger(value) || value < 0) {
    throw new WebsiteTestimonialServiceError("sortOrder must be a non-negative integer", 400);
  }
  return value;
}

function normalizeRating(value: number | null | undefined): number | null | undefined {
  if (value === undefined || value === null) return value;
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new WebsiteTestimonialServiceError("rating must be an integer between 1 and 5", 400);
  }
  return value;
}

function ensureId(id: string): string {
  const normalized = id.trim();
  if (!normalized) {
    throw new WebsiteTestimonialServiceError("Testimonial id is required", 400);
  }
  return normalized;
}

function ensureHasUpdateFields(input: UpdateTestimonialInput): void {
  if (
    input.clientName === undefined &&
    input.clientRole === undefined &&
    input.companyName === undefined &&
    input.quote === undefined &&
    input.avatarUrl === undefined &&
    input.rating === undefined &&
    input.isActive === undefined &&
    input.sortOrder === undefined
  ) {
    throw new WebsiteTestimonialServiceError("No fields provided for update", 400);
  }
}

export class WebsiteTestimonialService {
  async createTestimonial(input: CreateTestimonialInput): Promise<WebsiteTestimonial> {
    return prisma.websiteTestimonial.create({
      data: {
        clientName: ensureRequiredText(input.clientName, "clientName", 160),
        clientRole: normalizeOptionalText(input.clientRole, "clientRole", 160) ?? null,
        companyName: normalizeOptionalText(input.companyName, "companyName", 160) ?? null,
        quote: ensureRequiredText(input.quote, "quote", 5000),
        avatarUrl: normalizeOptionalText(input.avatarUrl, "avatarUrl", 2000) ?? null,
        rating: normalizeRating(input.rating) ?? null,
        isActive: input.isActive ?? true,
        sortOrder: normalizeSortOrder(input.sortOrder) ?? 0,
      },
    });
  }

  async updateTestimonial(id: string, input: UpdateTestimonialInput): Promise<WebsiteTestimonial> {
    const testimonialId = ensureId(id);
    ensureHasUpdateFields(input);

    const existing = await prisma.websiteTestimonial.findUnique({ where: { id: testimonialId }, select: { id: true } });
    if (!existing) {
      throw new WebsiteTestimonialServiceError("Website testimonial not found", 404);
    }

    return prisma.websiteTestimonial.update({
      where: { id: testimonialId },
      data: {
        clientName: input.clientName === undefined ? undefined : ensureRequiredText(input.clientName, "clientName", 160),
        clientRole: normalizeOptionalText(input.clientRole, "clientRole", 160),
        companyName: normalizeOptionalText(input.companyName, "companyName", 160),
        quote: input.quote === undefined ? undefined : ensureRequiredText(input.quote, "quote", 5000),
        avatarUrl: normalizeOptionalText(input.avatarUrl, "avatarUrl", 2000),
        rating: normalizeRating(input.rating),
        isActive: input.isActive,
        sortOrder: normalizeSortOrder(input.sortOrder),
      },
    });
  }

  async deleteTestimonial(id: string): Promise<void> {
    const testimonialId = ensureId(id);

    try {
      await prisma.websiteTestimonial.delete({ where: { id: testimonialId } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new WebsiteTestimonialServiceError("Website testimonial not found", 404);
      }
      throw error;
    }
  }

  async listTestimonialsAdmin(): Promise<WebsiteTestimonial[]> {
    return prisma.websiteTestimonial.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  }

  async listActiveTestimonialsPublic(): Promise<WebsiteTestimonial[]> {
    return prisma.websiteTestimonial.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  }
}