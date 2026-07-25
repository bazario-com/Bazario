import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  findAllForUser(userId: string) {
    return this.prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { addedAt: 'desc' },
      include: {
        product: {
          include: { images: { take: 1, orderBy: { sortOrder: 'asc' } } },
        },
      },
    });
  }

  async add(userId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, status: 'PUBLISHED', deletedAt: null },
    });
    if (!product) throw new NotFoundException('Product not found');

    // Idempotent: adding an already-wishlisted product just returns the
    // existing row rather than throwing, so the frontend can call this
    // freely without checking state first.
    return this.prisma.wishlistItem.upsert({
      where: { userId_productId: { userId, productId } },
      update: {},
      create: { userId, productId },
    });
  }

  async remove(userId: string, productId: string) {
    await this.prisma.wishlistItem.deleteMany({ where: { userId, productId } });
    return { success: true };
  }
}
