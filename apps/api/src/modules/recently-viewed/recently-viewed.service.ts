import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const MAX_TRACKED_PER_USER = 30;

@Injectable()
export class RecentlyViewedService {
  constructor(private readonly prisma: PrismaService) {}

  async record(userId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, status: 'PUBLISHED', deletedAt: null },
    });
    if (!product) throw new NotFoundException('Product not found');

    await this.prisma.recentlyViewed.upsert({
      where: { userId_productId: { userId, productId } },
      update: { viewedAt: new Date() },
      create: { userId, productId },
    });

    await this.pruneOldest(userId);
    return { success: true };
  }

  findAllForUser(userId: string, limit = 12) {
    return this.prisma.recentlyViewed.findMany({
      where: { userId },
      orderBy: { viewedAt: 'desc' },
      take: limit,
      include: {
        product: { include: { images: { take: 1, orderBy: { sortOrder: 'asc' } } } },
      },
    });
  }

  // Keeps the table bounded per user rather than growing forever — a simple
  // browsing history doesn't need unlimited retention, and this avoids ever
  // needing a background cleanup job for it.
  private async pruneOldest(userId: string) {
    const all = await this.prisma.recentlyViewed.findMany({
      where: { userId },
      orderBy: { viewedAt: 'desc' },
      skip: MAX_TRACKED_PER_USER,
      select: { id: true },
    });
    if (all.length > 0) {
      await this.prisma.recentlyViewed.deleteMany({
        where: { id: { in: all.map((r) => r.id) } },
      });
    }
  }
}
