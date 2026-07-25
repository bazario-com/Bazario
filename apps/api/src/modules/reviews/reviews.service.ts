import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, productId: string, dto: CreateReviewDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, status: 'PUBLISHED', deletedAt: null },
    });
    if (!product) throw new NotFoundException('Product not found');

    const existing = await this.prisma.review.findUnique({
      where: { productId_userId: { productId, userId } },
    });
    if (existing) {
      throw new ConflictException('You have already reviewed this product');
    }

    // A review is only marked verified if the reviewer has a delivered
    // order containing this exact product — this label is what customers
    // actually rely on, so it's derived from real order data, not
    // self-reported.
    const deliveredPurchase = await this.prisma.orderItem.findFirst({
      where: { productId, order: { userId, status: 'DELIVERED' } },
    });

    const review = await this.prisma.review.create({
      data: {
        productId,
        userId,
        rating: dto.rating,
        title: dto.title,
        body: dto.body,
        isVerifiedPurchase: Boolean(deliveredPurchase),
      },
    });

    await this.recalculateProductRating(productId);
    return review;
  }

  async remove(userId: string, reviewId: string) {
    const review = await this.prisma.review.findFirst({ where: { id: reviewId, userId } });
    if (!review) throw new NotFoundException('Review not found');

    await this.prisma.review.delete({ where: { id: reviewId } });
    await this.recalculateProductRating(review.productId);
    return { success: true };
  }

  // Denormalized onto Product (averageRating/reviewCount) so every product
  // list query gets rating data for free, without a join + aggregate on
  // every storefront page load. Recomputed from source-of-truth Review rows
  // whenever a review is added or removed — never incremented/decremented
  // in place, to avoid drift.
  private async recalculateProductRating(productId: string) {
    const aggregate = await this.prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        averageRating: aggregate._avg.rating ?? 0,
        reviewCount: aggregate._count.rating,
      },
    });
  }
}
