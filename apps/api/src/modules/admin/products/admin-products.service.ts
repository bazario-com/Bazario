import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

const VALID_STATUSES = ['DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'REJECTED', 'ARCHIVED'];

@Injectable()
export class AdminProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(status?: string) {
    if (status && !VALID_STATUSES.includes(status)) {
      throw new BadRequestException(`status must be one of: ${VALID_STATUSES.join(', ')}`);
    }
    return this.prisma.product.findMany({
      // ARCHIVED products have deletedAt set by design (see VendorProductsService.archive) —
      // excluding soft-deleted rows unconditionally would make the ARCHIVED
      // tab permanently empty, so that one status is the deliberate exception.
      where: { ...(status === 'ARCHIVED' ? {} : { deletedAt: null }), ...(status ? { status: status as any } : {}) },
      orderBy: { createdAt: 'desc' },
      include: {
        images: { take: 1, orderBy: { sortOrder: 'asc' } },
        vendor: { include: { store: true } },
      },
    });
  }

  async approve(productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.status === 'PUBLISHED') {
      throw new BadRequestException('Product is already published');
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: { status: 'PUBLISHED', publishedAt: new Date(), rejectedReason: null },
    });
  }

  async reject(productId: string, reason: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    return this.prisma.product.update({
      where: { id: productId },
      data: { status: 'REJECTED', rejectedReason: reason },
    });
  }
}
