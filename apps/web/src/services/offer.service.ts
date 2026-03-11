import { Prisma } from "@prisma/client";
import { prisma } from "../prisma/client.js";

export class OfferServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "OfferServiceError";
  }
}

export class OfferService {
  async create(input: {
    title: string;
    description?: string;
    credits: number;
    maxRedemptions: number;
    isActive?: boolean;
    createdById?: string;
  }) {
    return prisma.offer.create({
      data: {
        title: input.title,
        description: input.description ?? null,
        credits: input.credits,
        maxRedemptions: input.maxRedemptions,
        isActive: input.isActive ?? true,
        createdById: input.createdById,
      },
    });
  }

  async listAdmin() {
    const items = await prisma.offer.findMany({
      orderBy: [{ createdAt: "desc" }],
      include: {
        _count: {
          select: { redemptions: true },
        },
      },
    });

    return items.map((item) => ({
      ...item,
      remainingRedemptions: Math.max(0, item.maxRedemptions - item.redeemedCount),
      redemptionCount: item._count.redemptions,
    }));
  }

  async update(
    id: string,
    input: {
      title?: string;
      description?: string | null;
      credits?: number;
      maxRedemptions?: number;
      isActive?: boolean;
    },
  ) {
    const existing = await prisma.offer.findUnique({ where: { id } });
    if (!existing) {
      throw new OfferServiceError("Offer not found", 404);
    }

    const nextMaxRedemptions = input.maxRedemptions ?? existing.maxRedemptions;
    if (nextMaxRedemptions < existing.redeemedCount) {
      throw new OfferServiceError("maxRedemptions cannot be less than already redeemed count", 400);
    }

    return prisma.offer.update({
      where: { id },
      data: input,
    });
  }

  async remove(id: string) {
    try {
      await prisma.offer.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new OfferServiceError("Offer not found", 404);
      }
      throw error;
    }
  }

  async listActiveForUser(userId: string) {
    const offers = await prisma.offer.findMany({
      where: { isActive: true },
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        description: true,
        credits: true,
        maxRedemptions: true,
        redeemedCount: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const offerIds = offers.map((offer) => offer.id);
    const userRedemptions = offerIds.length
      ? await prisma.offerRedemption.findMany({
          where: {
            userId,
            offerId: { in: offerIds },
          },
          select: { offerId: true, createdAt: true },
        })
      : [];

    const redemptionMap = new Map(userRedemptions.map((redemption) => [redemption.offerId, redemption.createdAt]));

    return offers.map((offer) => ({
      ...offer,
      hasRedeemed: redemptionMap.has(offer.id),
      redeemedAt: redemptionMap.get(offer.id) ?? null,
      remainingRedemptions: Math.max(0, offer.maxRedemptions - offer.redeemedCount),
      isSoldOut: offer.redeemedCount >= offer.maxRedemptions,
    }));
  }

  async redeem(offerId: string, userId: string) {
    try {
      return await prisma.$transaction(async (tx) => {
        const offer = await tx.offer.findUnique({
          where: { id: offerId },
          select: {
            id: true,
            title: true,
            credits: true,
            isActive: true,
            maxRedemptions: true,
            redeemedCount: true,
          },
        });

        if (!offer || !offer.isActive) {
          throw new OfferServiceError("Offer not found or inactive", 404);
        }

        const existingRedemption = await tx.offerRedemption.findUnique({
          where: {
            offerId_userId: { offerId, userId },
          },
          select: { id: true },
        });

        if (existingRedemption) {
          throw new OfferServiceError("You have already availed this offer", 409);
        }

        if (offer.redeemedCount >= offer.maxRedemptions) {
          throw new OfferServiceError("Offer redemption limit reached", 409);
        }

        const updateResult = await tx.offer.updateMany({
          where: {
            id: offerId,
            isActive: true,
            redeemedCount: { lt: offer.maxRedemptions },
          },
          data: {
            redeemedCount: { increment: 1 },
          },
        });

        if (updateResult.count !== 1) {
          throw new OfferServiceError("Offer redemption limit reached", 409);
        }

        const redemption = await tx.offerRedemption.create({
          data: {
            offerId,
            userId,
            credits: offer.credits,
          },
          select: {
            id: true,
            createdAt: true,
            credits: true,
          },
        });

        const user = await tx.user.update({
          where: { id: userId },
          data: { credits: { increment: offer.credits } },
          select: { credits: true },
        });

        return {
          offerId: offer.id,
          offerTitle: offer.title,
          creditsAdded: offer.credits,
          credits: user.credits,
          redemption,
        };
      });
    } catch (error) {
      if (error instanceof OfferServiceError) {
        throw error;
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new OfferServiceError("You have already availed this offer", 409);
      }

      throw error;
    }
  }
}
