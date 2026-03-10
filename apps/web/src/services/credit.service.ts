import { prisma } from "../prisma/client.js";

export class CreditError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "CreditError";
  }
}

export class CreditService {
  /** Get the current credit balance for a user. */
  async getBalance(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });
    return user?.credits ?? 0;
  }

  /**
   * Deduct credits from a user atomically.
   * Throws CreditError if insufficient balance.
   */
  async deduct(userId: string, amount: number): Promise<number> {
    if (amount <= 0) return this.getBalance(userId);

    // Atomic check-and-decrement: only succeeds if credits >= amount
    try {
      const updated = await prisma.user.update({
        where: { id: userId, credits: { gte: amount } },
        data: { credits: { decrement: amount } },
        select: { credits: true },
      });
      return updated.credits;
    } catch {
      // If the where clause doesn't match, Prisma throws a RecordNotFound error
      const balance = await this.getBalance(userId);
      throw new CreditError(
        `Insufficient credits. You need ${amount} credits but only have ${balance}.`,
        402,
      );
    }
  }

  /** Add credits to a user (e.g. after package purchase). */
  async add(userId: string, amount: number): Promise<number> {
    if (amount <= 0) return this.getBalance(userId);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: amount } },
      select: { credits: true },
    });
    return updated.credits;
  }
}
