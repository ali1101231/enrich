import { z } from "zod";
import type { Request, Response } from "express";
import { SupportTicketService, SupportTicketServiceError } from "../services/support-ticket.service.js";

const replySchema = z.object({
  message: z.string().min(1).max(5000),
});

const statusSchema = z.object({
  status: z.enum(["OPEN", "CLOSED"]),
});

function handleSupportError(error: unknown, res: Response): boolean {
  if (error instanceof SupportTicketServiceError) {
    res.status(error.status).json({ error: error.message });
    return true;
  }
  return false;
}

export class AdminSupportController {
  constructor(private readonly service = new SupportTicketService()) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const items = await this.service.listAdmin();
    res.status(200).json({ items });
  };

  reply = async (req: Request, res: Response): Promise<void> => {
    const adminId = req.authUser?.id;
    if (!adminId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const body = replySchema.parse(req.body);

    try {
      const ticket = await this.service.replyAsAdmin(req.params.ticketId, adminId, body.message.trim());
      res.status(200).json(ticket);
    } catch (error) {
      if (!handleSupportError(error, res)) {
        throw error;
      }
    }
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    const body = statusSchema.parse(req.body);

    try {
      const ticket = await this.service.setStatus(req.params.ticketId, body.status);
      res.status(200).json(ticket);
    } catch (error) {
      if (!handleSupportError(error, res)) {
        throw error;
      }
    }
  };
}
