import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const [
      totalUsers,
      totalVendors,
      pendingVendors,
      totalProducts,
      pendingProducts,
      orderStats,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
      this.prisma.vendor.count({ where: { status: 'APPROVED' } }),
      this.prisma.vendor.count({ where: { status: 'PENDING' } }),
      this.prisma.product.count({ where: { status: 'PUBLISHED', deletedAt: null } }),
      this.prisma.product.count({ where: { status: 'PENDING_APPROVAL', deletedAt: null } }),
      this.prisma.order.aggregate({
        where: { status: { notIn: ['CANCELLED'] } },
        _sum: { totalCents: true },
        _count: { id: true },
      }),
    ]);

    return {
      totalUsers,
      totalVendors,
      pendingVendors,
      totalProducts,
      pendingProducts,
      totalOrders: orderStats._count.id,
      totalRevenueCents: orderStats._sum.totalCents ?? 0,
    };
  }
}
