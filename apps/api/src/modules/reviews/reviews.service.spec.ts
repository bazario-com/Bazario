import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      product: { findFirst: jest.fn(), update: jest.fn() },
      review: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        findFirst: jest.fn(),
        aggregate: jest.fn().mockResolvedValue({ _avg: { rating: 4.5 }, _count: { rating: 3 } }),
      },
      orderItem: { findFirst: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ReviewsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(ReviewsService);
  });

  it('throws NotFoundException for a non-existent or unpublished product', async () => {
    prisma.product.findFirst.mockResolvedValue(null);
    await expect(service.create('user-1', 'product-x', { rating: 5 })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects a second review from the same user on the same product', async () => {
    prisma.product.findFirst.mockResolvedValue({ id: 'p1' });
    prisma.review.findUnique.mockResolvedValue({ id: 'existing-review' });

    await expect(service.create('user-1', 'p1', { rating: 5 })).rejects.toThrow(
      ConflictException,
    );
  });

  it('marks a review verified only when a DELIVERED order for that product exists', async () => {
    prisma.product.findFirst.mockResolvedValue({ id: 'p1' });
    prisma.review.findUnique.mockResolvedValue(null);
    prisma.orderItem.findFirst.mockResolvedValue({ id: 'order-item-1' });
    prisma.review.create.mockResolvedValue({ id: 'review-1', isVerifiedPurchase: true });

    await service.create('user-1', 'p1', { rating: 5, body: 'Great product' });

    expect(prisma.orderItem.findFirst).toHaveBeenCalledWith({
      where: { productId: 'p1', order: { userId: 'user-1', status: 'DELIVERED' } },
    });
    expect(prisma.review.create.mock.calls[0][0].data.isVerifiedPurchase).toBe(true);
  });

  it('recalculates the product rating from Review aggregates after creating a review', async () => {
    prisma.product.findFirst.mockResolvedValue({ id: 'p1' });
    prisma.review.findUnique.mockResolvedValue(null);
    prisma.orderItem.findFirst.mockResolvedValue(null);
    prisma.review.create.mockResolvedValue({ id: 'review-1' });

    await service.create('user-1', 'p1', { rating: 3 });

    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { averageRating: 4.5, reviewCount: 3 },
    });
  });

  it('prevents deleting a review that does not belong to the requesting user', async () => {
    prisma.review.findFirst.mockResolvedValue(null);
    await expect(service.remove('attacker', 'someone-elses-review')).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.review.delete).not.toHaveBeenCalled();
  });
});
