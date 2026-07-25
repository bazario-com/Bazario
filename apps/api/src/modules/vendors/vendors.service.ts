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
        },
      });

      return { ...vendor, store };
    });
  }

  async updateStore(vendorId: string, dto: UpdateStoreDto) {
    return this.prisma.store.update({ where: { vendorId }, data: dto });
  }

  async getDashboardSummary(vendorId: string) {
    const [orderStats, productCount, pendingProductCount] = await Promise.all([
      this.prisma.order.aggregate({
        where: { vendorId, status: { notIn: ['CANCELLED'] } },
        _sum: { totalCents: true },
        _count: { id: true },
      }),
      this.prisma.product.count({ where: { vendorId, deletedAt: null } }),
      this.prisma.product.count({
        where: { vendorId, deletedAt: null, status: 'PENDING_APPROVAL' },
      }),
    ]);

    return {
      totalRevenueCents: orderStats._sum.totalCents ?? 0,
      totalOrders: orderStats._count.id,
      totalProducts: productCount,
      pendingApprovalProducts: pendingProductCount,
    };
  }
}
