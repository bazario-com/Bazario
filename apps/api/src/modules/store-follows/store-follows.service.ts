import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StoreFollowsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForUser(userId: string) {
    return this.prisma.storeFollow.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { store: true },
    });
  }

  async follow(userId: string, storeId: string) {
    const store = await this.prisma.store.findFirst({ where: { id: storeId, isActive: true } });
    if (!store) throw new NotFoundException('Store not found');

    // Idempotent, same pattern as wishlist — safe to call without checking state first.
    return this.prisma.storeFollow.upsert({
      where: { userId_storeId: { userId, storeId } },
      update: {},
      create: { userId, storeId },
    });
  }

  async unfollow(userId: string, storeId: string) {
    await this.prisma.storeFollow.deleteMany({ where: { userId, storeId } });
    return { success: true };
  }
}
