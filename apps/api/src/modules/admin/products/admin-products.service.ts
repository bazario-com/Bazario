import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../rbac/audit-log.service';

const VALID_STATUSES = ['DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'REJECTED', 'ARCHIVED'];
const SORTABLE_FIELDS = ['createdAt', 'title', 'basePriceCents'];

@Injectable()
export class AdminProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async findAll(status?: string, page = 1, pageSize = 20, sortBy?: string, sortDir: 'asc' | 'desc' = 'desc') {
    if (status && !VALID_STATUSES.includes(status)) {
      throw new BadRequestException(`status must be one of: ${VALID_STATUSES.join(', ')}`);
    }
    const orderField = sortBy && SORTABLE_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
    // ARCHIVED products have deletedAt set by design (see VendorProductsService.archive) —
    // excluding soft-deleted rows unconditionally would make the ARCHIVED
    // tab permanently empty, so that one status is the deliberate exception.
    const where = {
      ...(status === 'ARCHIVED' ? {} : { deletedAt: null }),
      ...(status ? { status: status as any } : {}),
    };
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: { [orderField]: sortDir },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          images: { take: 1, orderBy: { sortOrder: 'asc' } },
          vendor: { include: { store: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);
    return { products, total, page, pageSize };
  }

  async approve(productId: string, actorId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.status === 'PUBLISHED') {
      throw new BadRequestException('Product is already published');
    }

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: { status: 'PUBLISHED', publishedAt: new Date(), rejectedReason: null },
    });
    await this.auditLog.log(actorId, 'APPROVE_PRODUCT', {
      targetType: 'Product',
      targetId: productId,
      details: { title: product.title },
    });
    return updated;
  }

  async reject(productId: string, reason: string, actorId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: { status: 'REJECTED', rejectedReason: reason },
    });
    await this.auditLog.log(actorId, 'REJECT_PRODUCT', {
      targetType: 'Product',
      targetId: productId,
      details: { title: product.title, reason },
    });
    return updated;
  }

  // Mirrors VendorProductsService.archive() exactly (same status/deletedAt
  // fields), but on the admin side — vendors previously had no way to
  // un-archive at all, and admins had no way to pull a published product
  // without waiting on the vendor.
  async archiveProduct(productId: string, actorId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.status !== 'PUBLISHED') {
      throw new BadRequestException('Only published products can be archived');
    }

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: { status: 'ARCHIVED', deletedAt: new Date() },
    });
    await this.auditLog.log(actorId, 'ARCHIVE_PRODUCT', {
      targetType: 'Product',
      targetId: productId,
      details: { title: product.title },
    });
    return updated;
  }

  async restoreProduct(productId: string, actorId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.status !== 'ARCHIVED') {
      throw new BadRequestException('Only archived products can be restored');
    }

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: { status: 'PUBLISHED', deletedAt: null },
    });
    await this.auditLog.log(actorId, 'RESTORE_PRODUCT', {
      targetType: 'Product',
      targetId: productId,
      details: { title: product.title },
    });
    return updated;
  }
}
