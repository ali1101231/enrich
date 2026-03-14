import { Prisma, type ContactSubmission } from "@prisma/client";
import { prisma } from "../prisma/client.js";

export class ContactSubmissionServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ContactSubmissionServiceError";
  }
}

type CreateSubmissionInput = {
  fullName: string;
  email: string;
  company?: string | null;
  phone?: string | null;
  subject?: string | null;
  message: string;
};

function ensureRequiredText(value: string, fieldName: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new ContactSubmissionServiceError(`${fieldName} is required`, 400);
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

function ensureId(id: string): string {
  const normalized = id.trim();
  if (!normalized) {
    throw new ContactSubmissionServiceError("Submission id is required", 400);
  }
  return normalized;
}

function ensureValidEmail(email: string): string {
  const normalized = ensureRequiredText(email, "email").toLowerCase();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(normalized)) {
    throw new ContactSubmissionServiceError("email must be valid", 400);
  }

  return normalized;
}

function ensureStatus(status: string): string {
  return ensureRequiredText(status, "status").toLowerCase();
}

export class ContactSubmissionService {
  async createSubmission(input: CreateSubmissionInput): Promise<ContactSubmission> {
    return prisma.contactSubmission.create({
      data: {
        fullName: ensureRequiredText(input.fullName, "fullName"),
        email: ensureValidEmail(input.email),
        company: normalizeOptionalText(input.company) ?? null,
        phone: normalizeOptionalText(input.phone) ?? null,
        subject: normalizeOptionalText(input.subject) ?? null,
        message: ensureRequiredText(input.message, "message"),
      },
    });
  }

  async listSubmissions(): Promise<ContactSubmission[]> {
    return prisma.contactSubmission.findMany({
      orderBy: [{ createdAt: "desc" }],
    });
  }

  async getSubmissionById(submissionId: string): Promise<ContactSubmission> {
    const normalizedSubmissionId = ensureId(submissionId);

    const submission = await prisma.contactSubmission.findUnique({
      where: { id: normalizedSubmissionId },
    });

    if (!submission) {
      throw new ContactSubmissionServiceError("Contact submission not found", 404);
    }

    return submission;
  }

  async updateSubmissionStatus(submissionId: string, status: string): Promise<ContactSubmission> {
    const normalizedSubmissionId = ensureId(submissionId);
    const normalizedStatus = ensureStatus(status);

    try {
      return await prisma.contactSubmission.update({
        where: { id: normalizedSubmissionId },
        data: {
          status: normalizedStatus,
          repliedAt: normalizedStatus === "replied" ? new Date() : null,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new ContactSubmissionServiceError("Contact submission not found", 404);
      }
      throw error;
    }
  }

  async updateAdminNotes(submissionId: string, adminNotes: string | null): Promise<ContactSubmission> {
    const normalizedSubmissionId = ensureId(submissionId);

    try {
      return await prisma.contactSubmission.update({
        where: { id: normalizedSubmissionId },
        data: {
          adminNotes: normalizeOptionalText(adminNotes),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new ContactSubmissionServiceError("Contact submission not found", 404);
      }
      throw error;
    }
  }

  async markAsReplied(submissionId: string): Promise<ContactSubmission> {
    const normalizedSubmissionId = ensureId(submissionId);

    try {
      return await prisma.contactSubmission.update({
        where: { id: normalizedSubmissionId },
        data: {
          status: "replied",
          repliedAt: new Date(),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new ContactSubmissionServiceError("Contact submission not found", 404);
      }
      throw error;
    }
  }

  async deleteSubmission(submissionId: string): Promise<void> {
    const normalizedSubmissionId = ensureId(submissionId);

    try {
      await prisma.contactSubmission.delete({ where: { id: normalizedSubmissionId } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new ContactSubmissionServiceError("Contact submission not found", 404);
      }
      throw error;
    }
  }
}