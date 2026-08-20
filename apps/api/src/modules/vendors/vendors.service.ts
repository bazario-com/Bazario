import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterVendorDto } from './dto/register-vendor.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class VendorsService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.vendor.findUnique({ where: { id }, include: { store: true } });
  }

  findByUserId(userId: string) {
    return this.prisma.vendor.findUnique({ where: { userId }, include: { store: true } });
  }

  findByStoreSlug(slug: string) {
    return this.prisma.vendor.findFirst({ where: { store: { slug } }, include: { store: true } });
  }

  listApproved() {
    return this.prisma.vendor.findMany({
      where: { status: 'APPROVED' },
      include: { store: true },
    });
  }

  async register(userId: string, dto: RegisterVendorDto) {
    const existing = await this.prisma.vendor.findUnique({ where: { userId } });
    if (existing) {
      throw new ConflictException('You already have a vendor account');
    }

    const slugTaken = await this.prisma.store.findUnique({ where: { slug: dto.storeSlug } });
    if (slugTaken) {
      throw new ConflictException('That store URL is already taken — please choose another');
    }

    // Role flips to VENDOR immediately, but the vendor stays PENDING until
    // an admin approves them — product creation and coupon creation both
    // check `vendor.status === 'APPROVED'` separately, so a pending vendor
    // can explore their dashboard without being able to actually sell yet.
    // The role change on the JWT payload takes effect on next token refresh
    // (access tokens are short-lived, so this is a non-issue in practice).
    return this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { role: 'VENDOR' } });

      const vendor = await tx.vendor.create({
        data: {
          userId,
          businessName: dto.businessName,
          businessRegNumber: dto.businessRegNumber,
          status: 'PENDING',
        },
      });

      const store = await tx.store.create({
        data: {
          vendorId: vendor.id,
          name: dto.storeName,
          slug: dto.storeSlug,
          description: dto.storeDescription,
          address: dto.address,
          city: dto.city,
          contactPhone: dto.contactPhone,
        },
      });

      return { ...vendor, store };
    });
  }

  async updateStore(vendorId: string, dto: UpdateStoreDto) {
    return this.prisma.store.update({ where: { vendorId }, data: dto });
  }

  // Public storefront section — surfaces approved vendors with published
  // products, ranked by review-weighted rating (so a 5-star store with one
  // review doesn't outrank a 4.8-star store with hundreds).
  async getTopStores(limit = 6) {
    const stores = await this.prisma.store.findMany({
      where: {
        isActive: true,
        vendor: { status: 'APPROVED' },
      },
      include: {
        vendor: {
          include: {
            products: {
              where: { status: 'PUBLISHED', deletedAt: null },
              select: { averageRating: true, reviewCount: true },
            },
          },
        },
      },
    });

    const withStats = stores
      .map((store) => {
        const products = store.vendor.products;
        const productCount = products.length;
        const totalReviews = products.reduce((sum, p) => sum + p.reviewCount, 0);
        const weightedRatingSum = products.reduce(
          (sum, p) => sum + Number(p.averageRating) * p.reviewCount,
          0,
        );
        const rating = totalReviews > 0 ? weightedRatingSum / totalReviews : 0;

        return {
          id: store.id,
          name: store.name,
          slug: store.slug,
          logoUrl: store.logoUrl,
          city: store.city,
          productCount,
          reviewCount: totalReviews,
          rating: Math.round(rating * 10) / 10,
        };
      })
      .filter((s) => s.productCount > 0)
      .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);

    return withStats.slice(0, limit);
  }

  private resolvePeriod(period?: string): Date | undefined {
    if (!period || period === 'all') return undefined;
    const now = new Date();
    const days = { today: 1, '7d': 7, '30d': 30, '90d': 90 }[period];
    if (!days) return undefined;
    const from = new Date(now);
    from.setDate(from.getDate() - days);
    from.setHours(0, 0, 0, 0);
    return from;
  }

  // View-only — no reply/response field exists on the Review model, so this
  // deliberately does not offer a "reply" action.
  async getReviewsForVendor(vendorId: string, page = 1, pageSize = 20) {
    const where = { product: { vendorId } };
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          product: { select: { id: true, title: true, slug: true } },
          user: { select: { firstName: true, lastName: true } },
        },
      }),
      this.prisma.review.count({ where }),
    ]);
    return { reviews, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  }

  // Vendors cannot self-edit businessName/businessRegNumber/taxId once
  // registered — those go through admin review instead of a direct PATCH.
  submitInfoChangeRequest(vendorId: string, message: string) {
    return this.prisma.vendorInfoChangeRequest.create({
      data: { vendorId, message },
    });
  }

  listMyInfoChangeRequests(vendorId: string) {
    return this.prisma.vendorInfoChangeRequest.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDashboardSummary(vendorId: string, period?: string) {
    const LOW_STOCK_THRESHOLD = 5;
    const placedAtFrom = this.resolvePeriod(period);
    const dateFilter = placedAtFrom ? { placedAt: { gte: placedAtFrom } } : {};

    const [
      orderStats,
      productCount,
      pendingProductCount,
      statusGroups,
      uniqueCustomers,
      unitsSoldAgg,
      lowStockCount,
      outOfStockCount,
      draftCount,
      reviewAgg,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        where: { vendorId, status: { notIn: ['CANCELLED'] }, ...dateFilter },
        _sum: { totalCents: true },
        _count: { id: true },
      }),
      this.prisma.product.count({ where: { vendorId, deletedAt: null } }),
      this.prisma.product.count({
        where: { vendorId, deletedAt: null, status: 'PENDING_APPROVAL' },
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        where: { vendorId, ...dateFilter },
        _count: { id: true },
      }),
      this.prisma.order.findMany({
        where: { vendorId, ...dateFilter },
        distinct: ['userId'],
        select: { userId: true },
      }),
      this.prisma.orderItem.aggregate({
        where: { order: { vendorId, status: { notIn: ['CANCELLED'] }, ...dateFilter } },
        _sum: { quantity: true },
      }),
      this.prisma.productVariant.count({
        where: {
          stockQuantity: { gt: 0, lt: LOW_STOCK_THRESHOLD },
          product: { vendorId, deletedAt: null, status: 'PUBLISHED' },
        },
      }),
      this.prisma.productVariant.count({
        where: {
          stockQuantity: 0,
          product: { vendorId, deletedAt: null, status: 'PUBLISHED' },
        },
      }),
      this.prisma.product.count({ where: { vendorId, deletedAt: null, status: 'DRAFT' } }),
      this.prisma.review.aggregate({
        where: { product: { vendorId } },
        _avg: { rating: true },
        _count: { id: true },
      }),
    ]);

    const orderPipeline = Object.fromEntries(statusGroups.map((g) => [g.status, g._count.id]));

    return {
      totalRevenueCents: orderStats._sum.totalCents ?? 0,
      totalOrders: orderStats._count.id,
      totalProducts: productCount,
      pendingApprovalProducts: pendingProductCount,
      unitsSold: unitsSoldAgg._sum.quantity ?? 0,
      uniqueCustomers: uniqueCustomers.length,
      averageOrderValueCents:
        orderStats._count.id > 0
          ? Math.round((orderStats._sum.totalCents ?? 0) / orderStats._count.id)
          : 0,
      orderPipeline,
      inventory: {
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
        draft: draftCount,
      },
      reviews: {
        averageRating: reviewAgg._avg.rating ?? 0,
        totalReviews: reviewAgg._count.id,
      },
    };
  }
}
