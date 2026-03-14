import { z } from "zod";
import type { Request, Response } from "express";
import { ContactSubmissionService, ContactSubmissionServiceError } from "../services/contact-submission.service.js";

const createSchema = z.object({
  fullName: z.string().min(1).max(160),
  email: z.string().min(1).max(320),
  company: z.string().max(300).nullable().optional(),
  phone: z.string().max(100).nullable().optional(),
  subject: z.string().max(300).nullable().optional(),
  message: z.string().min(1).max(10000),
});

const statusSchema = z.object({
  status: z.string().min(1).max(80),
});

const notesSchema = z.object({
  adminNotes: z.string().max(10000).nullable(),
});

function handleContactSubmissionError(error: unknown, res: Response): boolean {
  if (error instanceof ContactSubmissionServiceError) {
    res.status(error.status).json({ error: error.message });
    return true;
  }
  return false;
}

export class ContactSubmissionController {
  constructor(private readonly service = new ContactSubmissionService()) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const body = createSchema.parse(req.body);

    try {
      const item = await this.service.createSubmission(body);
      res.status(201).json(item);
    } catch (error) {
      if (!handleContactSubmissionError(error, res)) {
        throw error;
      }
    }
  };

  list = async (_req: Request, res: Response): Promise<void> => {
    const items = await this.service.listSubmissions();
    res.status(200).json({ items });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const item = await this.service.getSubmissionById(req.params.submissionId);
      res.status(200).json(item);
    } catch (error) {
      if (!handleContactSubmissionError(error, res)) {
        throw error;
      }
    }
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    const body = statusSchema.parse(req.body);

    try {
      const item = await this.service.updateSubmissionStatus(req.params.submissionId, body.status);
      res.status(200).json(item);
    } catch (error) {
      if (!handleContactSubmissionError(error, res)) {
        throw error;
      }
    }
  };

  updateNotes = async (req: Request, res: Response): Promise<void> => {
    const body = notesSchema.parse(req.body);

    try {
      const item = await this.service.updateAdminNotes(req.params.submissionId, body.adminNotes);
      res.status(200).json(item);
    } catch (error) {
      if (!handleContactSubmissionError(error, res)) {
        throw error;
      }
    }
  };

  markReplied = async (req: Request, res: Response): Promise<void> => {
    try {
      const item = await this.service.markAsReplied(req.params.submissionId);
      res.status(200).json(item);
    } catch (error) {
      if (!handleContactSubmissionError(error, res)) {
        throw error;
      }
    }
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.service.deleteSubmission(req.params.submissionId);
      res.status(204).send();
    } catch (error) {
      if (!handleContactSubmissionError(error, res)) {
        throw error;
      }
    }
  };
}