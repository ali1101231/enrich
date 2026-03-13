import { z } from "zod";
import type { Request, Response } from "express";
import { SupportTicketService, SupportTicketServiceError } from "../services/support-ticket.service.js";

const createSchema = z.object({
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
});

const replySchema = z.object({
  message: z.string().min(1).max(5000),
});

function handleSupportError(error: unknown, res: Response): boolean {
  if (error instanceof SupportTicketServiceError) {
    res.status(error.status).json({ error: error.message });
    return true;
  }
  return false;
}

export class SupportController {
  constructor(private readonly service = new SupportTicketService()) {}

  listMine = async (req: Request, res: Response): Promise<void> => {
    const userId = req.authUser?.id;
    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const items = await this.service.listForUser(userId);
    res.status(200).json({ items });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const userId = req.authUser?.id;
    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const body = createSchema.parse(req.body);

    try {
      const ticket = await this.service.createTicket({
        userId,
        subject: body.subject.trim(),
        message: body.message.trim(),
      });
      res.status(201).json(ticket);
    } catch (error) {
      if (!handleSupportError(error, res)) {
        throw error;
      }
    }
  };

  reply = async (req: Request, res: Response): Promise<void> => {
    const userId = req.authUser?.id;
    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const body = replySchema.parse(req.body);

    try {
      const ticket = await this.service.replyAsUser(req.params.ticketId, userId, body.message.trim());
      res.status(200).json(ticket);
    } catch (error) {
      if (!handleSupportError(error, res)) {
        throw error;
      }
    }
  };
}
