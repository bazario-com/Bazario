import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ListProductsDto, ProductSort } from './dto/list-products.dto';

const SORT_MAP: Record<ProductSort, Prisma.ProductOrderByWithRelationInput> = {
  [ProductSort.NEWEST]: { publishedAt: 'desc' },
  [ProductSort.PRICE_ASC]: { basePriceCents: 'asc' },
  [ProductSort.PRICE_DESC]: { basePriceCents: 'desc' },
  [ProductSort.RATING]: { averageRating: 'desc' },
  [ProductSort.BEST_SELLING]: { totalSold: 'desc' },
};

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListProductsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 24;

    const where: Prisma.ProductWhereInput = {
      status: 'PUBLISHED',
      deletedAt: null,
      ...(query.categorySlug ? { category: { slug: query.categorySlug } } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
              { brand: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.minPriceCents || query.maxPriceCents
        ? {
            basePriceCents: {
              ...(query.minPriceCents ? { gte: query.minPriceCents } : {}),
              ...(query.maxPriceCents ? { lte: query.maxPriceCents } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy: SORT_MAP[query.sort ?? ProductSort.NEWEST],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          vendor: { include: { store: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  findBySlug(slug: string) {
    return this.prisma.product.findFirst({
      where: { slug, status: 'PUBLISHED', deletedAt: null },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { where: { isActive: true } },
        vendor: { include: { store: true } },
        category: true,
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
        },
      },
    });
  }

  findFeatured(limit = 12) {
    return this.prisma.product.findMany({
      where: { status: 'PUBLISHED', deletedAt: null, isFeatured: true },
      take: limit,
      orderBy: { publishedAt: 'desc' },
      include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
    });
  }

  findFlashSale(limit = 12) {
    return this.prisma.product.findMany({
      where: { status: 'PUBLISHED', deletedAt: null, discountPct: { gt: 0 } },
      take: limit,
      orderBy: { discountPct: 'desc' },
      include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
    });
  }
}
