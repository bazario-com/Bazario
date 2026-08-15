import { BadRequestException, Injectable, NotFoundException, NotImplementedException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CouponsService, VendorSubtotal } from '../coupons/coupons.service';
import { CheckoutDto } from './dto/checkout.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly couponsService: CouponsService,
  ) {}

  async checkout(userId: string, dto: CheckoutDto) {
    if (dto.paymentMethod !== 'COD') {
      // Card/JazzCash/Easypaisa/bank transfer need a real gateway
      // integration (auth, webhook handling, idempotency) — that's the
      // whole scope of the Payment Integration phase. Failing loudly here
      // is safer than silently treating an unpaid order as paid.
      throw new NotImplementedException(
        `${dto.paymentMethod} is not yet available — this arrives in the Payment Integration phase. Cash on Delivery works today.`,
      );
    }

    const address = await this.prisma.address.findFirst({
      where: { id: dto.addressId, userId },
    });
    if (!address) throw new NotFoundException('Shipping address not found');

    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: { include: { product: true, variant: true } },
      },
    });
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Your cart is empty');
    }

    // Group cart lines by vendor — checkout fans out into one Order per
    // vendor (see ARCHITECTURE.md for why), sharing a single orderGroupId.
    const itemsByVendor = new Map<string, typeof cart.items>();
    for (const item of cart.items) {
      const vendorId = item.product.vendorId;
      if (!itemsByVendor.has(vendorId)) itemsByVendor.set(vendorId, []);
      itemsByVendor.get(vendorId)!.push(item);
    }

    const vendorSubtotals: VendorSubtotal[] = [...itemsByVendor.entries()].map(
      ([vendorId, items]) => ({
        vendorId,
        subtotalCents: items.reduce((sum, i) => sum + i.variant.priceCents * i.quantity, 0),
      }),
    );

    let discountByVendor = new Map<string, number>();
    let appliedCoupon: { id: string; totalDiscountCents: number } | null = null;

    if (dto.couponCode) {
      const result = await this.couponsService.validateAndCalculate(
        dto.couponCode,
        userId,
        vendorSubtotals,
      );
      discountByVendor = result.discountByVendor;
      appliedCoupon = { id: result.coupon.id, totalDiscountCents: result.totalDiscountCents };
    }

    const orderGroupId = randomUUID();

    // Everything below must succeed or fail together: stock decrements,
    // order creation, and cart clearing. An interactive transaction also
    // gives us row-level locking on the stock check via the atomic
    // updateMany below, so two simultaneous checkouts can't both succeed
    // against the same last unit of stock.
    const orders = await this.prisma.$transaction(async (tx) => {
      const createdOrders = [];

      for (const [vendorId, items] of itemsByVendor) {
        for (const item of items) {
          const decremented = await tx.productVariant.updateMany({
            where: { id: item.variantId, stockQuantity: { gte: item.quantity } },
            data: { stockQuantity: { decrement: item.quantity } },
          });
          if (decremented.count === 0) {
            throw new BadRequestException(
              `"${item.product.title}" no longer has enough stock — please update your cart`,
            );
          }
          await tx.product.update({
            where: { id: item.productId },
            data: { totalSold: { increment: item.quantity } },
          });
        }

        const subtotalCents = items.reduce((sum, i) => sum + i.variant.priceCents * i.quantity, 0);
        const discountCents = discountByVendor.get(vendorId) ?? 0;
        const totalCents = Math.max(0, subtotalCents - discountCents);

        const order = await tx.order.create({
          data: {
            orderGroupId,
            orderNumber: this.generateOrderNumber(),
            userId,
            vendorId,
            addressId: dto.addressId,
            status: 'CONFIRMED',
            paymentStatus: 'UNPAID', // COD is captured on delivery, not at order time
            paymentMethod: dto.paymentMethod,
            subtotalCents,
            discountCents,
            shippingCents: 0, // flat/free shipping until the Shipping Integration phase computes real rates
            taxCents: 0,
            totalCents,
            couponCode: appliedCoupon ? dto.couponCode : undefined,
            items: {
              create: items.map((item) => ({
                productId: item.productId,
                variantId: item.variantId,
                titleSnapshot: item.product.title,
                optionsSnapshot: item.variant.optionsJson as any,
                unitPriceCents: item.variant.priceCents,
                quantity: item.quantity,
                lineTotalCents: item.variant.priceCents * item.quantity,
              })),
            },
          },
          include: { items: true },
        });

        createdOrders.push(order);
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return createdOrders;
    });

    if (appliedCoupon) {
      await this.couponsService.recordRedemption(
        appliedCoupon.id,
        userId,
        orderGroupId,
        appliedCoupon.totalDiscountCents,
      );
    }

    return orders;
  }

  findAllForUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { placedAt: 'desc' },
      include: {
        items: {
          include: { product: { include: { images: { take: 1, orderBy: { sortOrder: 'asc' } } } } },
        },
        vendor: { include: { store: true } },
      },
    });
  }

  async findOneForUser(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true, vendor: { include: { store: true } }, shippingAddress: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  private generateOrderNumber(): string {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = randomUUID().split('-')[0].toUpperCase();
    return `ORD-${datePart}-${randomPart}`;
  }
}
