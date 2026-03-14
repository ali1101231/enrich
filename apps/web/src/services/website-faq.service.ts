import { Prisma, type WebsiteFaq } from "@prisma/client";
import { prisma } from "../prisma/client.js";

export class WebsiteFaqServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "WebsiteFaqServiceError";
  }
}

type CreateFaqInput = {
  question: string;
  answer: string;
  isActive?: boolean;
  sortOrder?: number;
};

type UpdateFaqInput = {
  question?: string;
  answer?: string;
  isActive?: boolean;
  sortOrder?: number;
};

function ensureRequiredText(value: string, fieldName: string, maxLength: number): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new WebsiteFaqServiceError(`${fieldName} is required`, 400);
  }
  if (normalized.length > maxLength) {
    throw new WebsiteFaqServiceError(`${fieldName} must be at most ${maxLength} characters`, 400);
  }
  return normalized;
}

function normalizeSortOrder(value: number | undefined): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isInteger(value) || value < 0) {
    throw new WebsiteFaqServiceError("sortOrder must be a non-negative integer", 400);
  }
  return value;
}

function ensureId(id: string): string {
  const normalized = id.trim();
  if (!normalized) {
    throw new WebsiteFaqServiceError("FAQ id is required", 400);
  }
  return normalized;
}

function ensureHasUpdateFields(input: UpdateFaqInput): void {
  if (input.question === undefined && input.answer === undefined && input.isActive === undefined && input.sortOrder === undefined) {
    throw new WebsiteFaqServiceError("No fields provided for update", 400);
  }
}

export class WebsiteFaqService {
  async createFaq(input: CreateFaqInput): Promise<WebsiteFaq> {
    return prisma.websiteFaq.create({
      data: {
        question: ensureRequiredText(input.question, "question", 300),
        answer: ensureRequiredText(input.answer, "answer", 10000),
        isActive: input.isActive ?? true,
        sortOrder: normalizeSortOrder(input.sortOrder) ?? 0,
      },
    });
  }

  async updateFaq(id: string, input: UpdateFaqInput): Promise<WebsiteFaq> {
    const faqId = ensureId(id);
    ensureHasUpdateFields(input);

    const existing = await prisma.websiteFaq.findUnique({ where: { id: faqId }, select: { id: true } });
    if (!existing) {
      throw new WebsiteFaqServiceError("Website FAQ not found", 404);
    }

    return prisma.websiteFaq.update({
      where: { id: faqId },
      data: {
        question: input.question === undefined ? undefined : ensureRequiredText(input.question, "question", 300),
        answer: input.answer === undefined ? undefined : ensureRequiredText(input.answer, "answer", 10000),
        isActive: input.isActive,
        sortOrder: normalizeSortOrder(input.sortOrder),
      },
    });
  }

  async deleteFaq(id: string): Promise<void> {
    const faqId = ensureId(id);

    try {
      await prisma.websiteFaq.delete({ where: { id: faqId } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new WebsiteFaqServiceError("Website FAQ not found", 404);
      }
      throw error;
    }
  }

  async listFaqAdmin(): Promise<WebsiteFaq[]> {
    return prisma.websiteFaq.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  }

  async listActiveFaqPublic(): Promise<WebsiteFaq[]> {
    return prisma.websiteFaq.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  }
}