import { Prisma, type WebsiteLogo } from "@prisma/client";
import { prisma } from "../prisma/client.js";

export class WebsiteLogoServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "WebsiteLogoServiceError";
  }
}

type CreateLogoInput = {
  name: string;
  imageUrl: string;
  altText?: string | null;
  href?: string | null;
  isActive?: boolean;
  sortOrder?: number;
};

type UpdateLogoInput = {
  name?: string;
  imageUrl?: string;
  altText?: string | null;
  href?: string | null;
  isActive?: boolean;
  sortOrder?: number;
};

function ensureRequiredText(value: string, fieldName: string, maxLength: number): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new WebsiteLogoServiceError(`${fieldName} is required`, 400);
  }
  if (normalized.length > maxLength) {
    throw new WebsiteLogoServiceError(`${fieldName} must be at most ${maxLength} characters`, 400);
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
    throw new WebsiteLogoServiceError(`${fieldName} must be at most ${maxLength} characters`, 400);
  }
  return normalized;
}

function normalizeSortOrder(value: number | undefined): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isInteger(value) || value < 0) {
    throw new WebsiteLogoServiceError("sortOrder must be a non-negative integer", 400);
  }
  return value;
}

function ensureId(id: string): string {
  const normalized = id.trim();
  if (!normalized) {
    throw new WebsiteLogoServiceError("Logo id is required", 400);
  }
  return normalized;
}

function ensureHasUpdateFields(input: UpdateLogoInput): void {
  if (
    input.name === undefined &&
    input.imageUrl === undefined &&
    input.altText === undefined &&
    input.href === undefined &&
    input.isActive === undefined &&
    input.sortOrder === undefined
  ) {
    throw new WebsiteLogoServiceError("No fields provided for update", 400);
  }
}

export class WebsiteLogoService {
  async createLogo(input: CreateLogoInput): Promise<WebsiteLogo> {
    return prisma.websiteLogo.create({
      data: {
        name: ensureRequiredText(input.name, "name", 160),
        imageUrl: ensureRequiredText(input.imageUrl, "imageUrl", 2000),
        altText: normalizeOptionalText(input.altText, "altText", 300) ?? null,
        href: normalizeOptionalText(input.href, "href", 2000) ?? null,
        isActive: input.isActive ?? true,
        sortOrder: normalizeSortOrder(input.sortOrder) ?? 0,
      },
    });
  }

  async updateLogo(id: string, input: UpdateLogoInput): Promise<WebsiteLogo> {
    const logoId = ensureId(id);
    ensureHasUpdateFields(input);

    const existing = await prisma.websiteLogo.findUnique({ where: { id: logoId }, select: { id: true } });
    if (!existing) {
      throw new WebsiteLogoServiceError("Website logo not found", 404);
    }

    return prisma.websiteLogo.update({
      where: { id: logoId },
      data: {
        name: input.name === undefined ? undefined : ensureRequiredText(input.name, "name", 160),
        imageUrl: input.imageUrl === undefined ? undefined : ensureRequiredText(input.imageUrl, "imageUrl", 2000),
        altText: normalizeOptionalText(input.altText, "altText", 300),
        href: normalizeOptionalText(input.href, "href", 2000),
        isActive: input.isActive,
        sortOrder: normalizeSortOrder(input.sortOrder),
      },
    });
  }

  async deleteLogo(id: string): Promise<void> {
    const logoId = ensureId(id);

    try {
      await prisma.websiteLogo.delete({ where: { id: logoId } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new WebsiteLogoServiceError("Website logo not found", 404);
      }
      throw error;
    }
  }

  async listLogosAdmin(): Promise<WebsiteLogo[]> {
    return prisma.websiteLogo.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  }

  async listActiveLogosPublic(): Promise<WebsiteLogo[]> {
    return prisma.websiteLogo.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  }
}