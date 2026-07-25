import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateVendorProductDto } from './dto/create-vendor-product.dto';
import { UpdateVendorProductDto } from './dto/update-vendor-product.dto';

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') +
    '-' +
    Math.random().toString(36).slice(2, 7)
  ); // random suffix avoids a slug collision when two vendors sell the same-titled item
}

@Injectable()
export class VendorProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(vendorId: string, dto: CreateVendorProductDto) {
    const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
    if (!category) throw new NotFoundException('Category not found');

    return this.prisma.product.create({
      data: {
        vendorId,
        categoryId: dto.categoryId,
        title: dto.title,
        slug: slugify(dto.title),
        description: dto.description,
        brand: dto.brand,
        basePriceCents: dto.basePriceCents,
        discountPct: dto.discountPct ?? 0,
        status: 'PENDING_APPROVAL', // every new product needs admin sign-off before it's visible storefront-side
        images: { create: dto.imageUrls.map((url, i) => ({ url, sortOrder: i })) },
        variants: {
          create: dto.variants.map((v) => ({
            sku: v.sku,
            optionsJson: v.optionsJson ?? {},
            priceCents: v.priceCents,
            stockQuantity: v.stockQuantity,
          })),
        },
      },
      include: { images: true, variants: true },
    });
  }

  async findAllForVendor(vendorId: string) {
    return this.prisma.product.findMany({
      where: { vendorId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { images: { take: 1, orderBy: { sortOrder: 'asc' } }, variants: true },
    });
  }

  async findOneForVendor(vendorId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, vendorId, deletedAt: null },
      include: { images: true, variants: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(vendorId: string, productId: string, dto: UpdateVendorProductDto) {
    const existing = await this.findOneForVendor(vendorId, productId);

    // Editing anything customer-facing on an already-published listing
    // sends it back for re-approval — otherwise a vendor could get a
    // product approved, then silently swap in something different.
    const touchesPublicFields =
      dto.title !== undefined ||
      dto.description !== undefined ||
      dto.basePriceCents !== undefined ||
      dto.imageUrls !== undefined;
    const nextStatus =
      existing.status === 'PUBLISHED' && touchesPublicFields ? 'PENDING_APPROVAL' : undefined;

    return this.prisma.product.update({
      where: { id: productId },
      data: {
        title: dto.title,
        categoryId: dto.categoryId,
        description: dto.description,
        brand: dto.brand,
        basePriceCents: dto.basePriceCents,
        discountPct: dto.discountPct,
        ...(nextStatus ? { status: nextStatus, publishedAt: null } : {}),
        ...(dto.imageUrls
          ? {
              images: {
                deleteMany: {},
                create: dto.imageUrls.map((url, i) => ({ url, sortOrder: i })),
              },
            }
          : {}),
      },
      include: { images: true, variants: true },
    });
  }

  async updateVariantStock(vendorId: string, variantId: string, stockQuantity: number) {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, product: { vendorId } },
    });
    if (!variant) throw new NotFoundException('Variant not found');

    return this.prisma.productVariant.update({
      where: { id: variantId },
      data: { stockQuantity },
    });
  }

  async archive(vendorId: string, productId: string) {
    await this.findOneForVendor(vendorId, productId); // ownership check
    await this.prisma.product.update({
      where: { id: productId },
      data: { status: 'ARCHIVED', deletedAt: new Date() },
    });
    return { success: true };
  }
}
