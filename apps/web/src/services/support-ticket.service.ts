import { Prisma, type SupportTicketStatus } from "@prisma/client";
import { prisma } from "../prisma/client.js";

export class SupportTicketServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "SupportTicketServiceError";
  }
}

const ticketInclude = {
  user: {
    select: {
      id: true,
      email: true,
      displayName: true,
    },
  },
  messages: {
    orderBy: { createdAt: "asc" as const },
    include: {
      sender: {
        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
        },
      },
    },
  },
} as const;

export class SupportTicketService {
  async listForUser(userId: string) {
    return prisma.supportTicket.findMany({
      where: { userId },
      orderBy: [{ updatedAt: "desc" }],
      include: ticketInclude,
    });
  }

  async listAdmin() {
    return prisma.supportTicket.findMany({
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      include: ticketInclude,
    });
  }

  async createTicket(input: { userId: string; subject: string; message: string }) {
    return prisma.supportTicket.create({
      data: {
        userId: input.userId,
        subject: input.subject,
        status: "OPEN",
        messages: {
          create: {
            senderId: input.userId,
            senderRole: "USER",
            message: input.message,
          },
        },
      },
      include: ticketInclude,
    });
  }

  async replyAsUser(ticketId: string, userId: string, message: string) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!ticket) {
      throw new SupportTicketServiceError("Ticket not found", 404);
    }

    if (ticket.userId !== userId) {
      throw new SupportTicketServiceError("Forbidden", 403);
    }

    return prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: "OPEN",
        closedAt: null,
        messages: {
          create: {
            senderId: userId,
            senderRole: "USER",
            message,
          },
        },
      },
      include: ticketInclude,
    });
  }

  async replyAsAdmin(ticketId: string, adminId: string, message: string) {
    try {
      return await prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: "OPEN",
          closedAt: null,
          messages: {
            create: {
              senderId: adminId,
              senderRole: "ADMIN",
              message,
            },
          },
        },
        include: ticketInclude,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new SupportTicketServiceError("Ticket not found", 404);
      }
      throw error;
    }
  }

  async setStatus(ticketId: string, status: SupportTicketStatus) {
    try {
      return await prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          status,
          closedAt: status === "CLOSED" ? new Date() : null,
        },
        include: ticketInclude,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new SupportTicketServiceError("Ticket not found", 404);
      }
      throw error;
    }
  }
}
