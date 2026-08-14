import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RewardsService } from '../rewards/rewards.service';

const REFERRAL_BONUS_POINTS = 50;

@Injectable()
export class ReferralsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rewardsService: RewardsService,
  ) {}

  private generateCode(): string {
    return `SHOP${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }

  async getOrCreateCode(userId: string) {
    const existing = await this.prisma.referralCode.findUnique({ where: { userId } });
    if (existing) return existing;

    // Small retry loop for the unlikely case of a code collision.
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        return await this.prisma.referralCode.create({
          data: { userId, code: this.generateCode() },
        });
      } catch {
        // unique constraint hit — try again with a fresh random suffix
      }
    }
    throw new Error('Could not generate a unique referral code — please try again');
  }

  async getMe(userId: string) {
    const referralCode = await this.getOrCreateCode(userId);
    const referredCount = await this.prisma.referral.count({ where: { referrerUserId: userId } });
    return { code: referralCode.code, referredCount };
  }

  // Called during registration. Silently no-ops on an invalid code, a
  // self-referral, or if this new user was somehow already recorded as
  // referred — a bad/missing code should never block signup.
  async redeemCode(newUserId: string, code: string) {
    const referralCode = await this.prisma.referralCode.findUnique({ where: { code } });
    if (!referralCode || referralCode.userId === newUserId) return null;

    const alreadyReferred = await this.prisma.referral.findUnique({
      where: { referredUserId: newUserId },
    });
    if (alreadyReferred) return null;

    const referral = await this.prisma.referral.create({
      data: { referrerUserId: referralCode.userId, referredUserId: newUserId },
    });

    await this.rewardsService.getOrCreateAccount(referralCode.userId);
    await this.prisma.rewardsAccount.update({
      where: { userId: referralCode.userId },
      data: {
        pointsBalance: { increment: REFERRAL_BONUS_POINTS },
        lifetimePoints: { increment: REFERRAL_BONUS_POINTS },
      },
    });
    const account = await this.prisma.rewardsAccount.findUnique({
      where: { userId: referralCode.userId },
    });
    await this.prisma.rewardsTransaction.create({
      data: {
        accountId: account!.id,
        points: REFERRAL_BONUS_POINTS,
        type: 'EARNED',
        reason: 'Referral bonus — friend signed up',
      },
    });
    await this.prisma.referral.update({
      where: { id: referral.id },
      data: { rewardedAt: new Date() },
    });

    return referral;
  }
}
