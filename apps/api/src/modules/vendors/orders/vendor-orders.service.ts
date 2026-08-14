import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { RewardsService } from '../../rewards/rewards.service';

// The only forward moves a vendor can make. Anything not listed here as a
// key (e.g. DELIVERED, CANCELLED) is terminal from the vendor's side.
const ALLOWED_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
};

@Injectable()
export class VendorOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rewardsService: RewardsService,
  ) {}

  findAllForVendor(vendorId: string) {
    return this.prisma.order.findMany({
      where: { vendorId },
      orderBy: { placedAt: 'desc' },
      include: {
        items: true,
        shippingAddress: true,
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });
  }

  async findOneForVendor(vendorId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, vendorId },
      include: { items: true, shippingAddress: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(vendorId: string, orderId: string, nextStatus: OrderStatus) {
    const order = await this.findOneForVendor(vendorId, orderId);

    const allowedNext = ALLOWED_TRANSITIONS[order.status] ?? [];
    if (!allowedNext.includes(nextStatus)) {
      throw new BadRequestException(
        `Order can't move from ${order.status} to ${nextStatus}`,
      );
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: nextStatus,
        // COD is captured on delivery — this is the one place payment
        // status actually changes for a COD order in this phase.
        ...(nextStatus === 'DELIVERED' && order.paymentMethod === 'COD'
          ? { paymentStatus: 'PAID' }
          : {}),
      },
    });

    if (nextStatus === 'DELIVERED') {
      await this.rewardsService.earnForDeliveredOrder(order.userId, order.id, order.totalCents);
    }

    return updated;
  }
}
