import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Simple, transparent earn rate: 1 point per PKR 100 spent (totalCents is
// stored in paisa, so 100 PKR = 10,000 paisa). Kept as a single constant so
// the rate is easy to find and adjust later without touching call sites.
const POINTS_PER_PKR_100 = 1;
const CENTS_PER_UNIT = 10_000;

@Injectable()
export class RewardsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateAccount(userId: string) {
    return this.prisma.rewardsAccount.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  async getMe(userId: string) {
    const account = await this.getOrCreateAccount(userId);
    const recentTransactions = await this.prisma.rewardsTransaction.findMany({
      where: { accountId: account.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    return { ...account, recentTransactions };
  }

  // Called from the vendor order-status flow when an order transitions to
  // DELIVERED. Guarded against double-awarding by checking for an existing
  // EARNED transaction tied to this orderId first — safe to call more than
  // once for the same order.
  async earnForDeliveredOrder(userId: string, orderId: string, totalCents: number) {
    const alreadyAwarded = await this.prisma.rewardsTransaction.findFirst({
      where: { orderId, type: 'EARNED' },
    });
    if (alreadyAwarded) return null;

    const points = Math.floor(totalCents / CENTS_PER_UNIT) * POINTS_PER_PKR_100;
    if (points <= 0) return null;

    const account = await this.getOrCreateAccount(userId);

    return this.prisma.$transaction(async (tx) => {
      await tx.rewardsAccount.update({
        where: { id: account.id },
        data: {
          pointsBalance: { increment: points },
          lifetimePoints: { increment: points },
        },
      });
      return tx.rewardsTransaction.create({
        data: {
          accountId: account.id,
          points,
          type: 'EARNED',
          reason: 'Order delivered',
          orderId,
        },
      });
    });
  }
}
