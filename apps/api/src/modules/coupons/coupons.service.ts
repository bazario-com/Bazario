import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Coupon, CouponDiscountType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';

export interface VendorSubtotal {
  vendorId: string;
  subtotalCents: number;
}

export interface CouponApplication {
  coupon: Coupon;
  totalDiscountCents: number;
  discountByVendor: Map<string, number>;
}

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(vendorId: string | null, dto: CreateCouponDto) {
    if (dto.discountType === CouponDiscountType.PERCENTAGE && dto.discountValue > 100) {
      throw new BadRequestException('Percentage discount cannot exceed 100');
    }

    return this.prisma.coupon.create({
      data: {
        code: dto.code.toUpperCase(),
        description: dto.description,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        minOrderCents: dto.minOrderCents ?? 0,
        maxRedemptions: dto.maxRedemptions,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        vendorId,
      },
    });
  }

  // Validates a coupon against the *entire* cart (grouped by vendor, since
  // checkout produces one Order per vendor) and returns how much discount
  // applies to each vendor's slice. A vendor-scoped coupon only discounts
  // that vendor's subtotal; a platform-wide coupon (vendorId = null)
  // discounts proportionally across every vendor in the cart.
  async validateAndCalculate(
    code: string,
    userId: string,
    vendorSubtotals: VendorSubtotal[],
  ): Promise<CouponApplication> {
    const coupon = await this.prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon || !coupon.isActive) {
      throw new NotFoundException('Coupon not found or no longer active');
    }

    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) {
      throw new BadRequestException('This coupon is not active yet');
    }
    if (coupon.expiresAt && coupon.expiresAt < now) {
      throw new BadRequestException('This coupon has expired');
    }

    if (coupon.maxRedemptions !== null) {
      const redemptionCount = await this.prisma.couponRedemption.count({
        where: { couponId: coupon.id },
      });
      if (redemptionCount >= coupon.maxRedemptions) {
        throw new BadRequestException('This coupon has reached its redemption limit');
      }
    }

    const applicableSubtotals = coupon.vendorId
      ? vendorSubtotals.filter((v) => v.vendorId === coupon.vendorId)
      : vendorSubtotals;

    const applicableTotalCents = applicableSubtotals.reduce((sum, v) => sum + v.subtotalCents, 0);

    if (applicableTotalCents === 0) {
      throw new BadRequestException('This coupon does not apply to any items in your cart');
    }
    if (applicableTotalCents < coupon.minOrderCents) {
      throw new BadRequestException(
        `This coupon requires a minimum order of ${(coupon.minOrderCents / 100).toFixed(2)}`,
      );
    }

    const totalDiscountCents =
      coupon.discountType === CouponDiscountType.PERCENTAGE
        ? Math.round((applicableTotalCents * coupon.discountValue) / 100)
        : Math.min(coupon.discountValue, applicableTotalCents);

    // Distribute the discount pro-rata across applicable vendors so each
    // resulting per-vendor Order carries an accurate discountCents figure.
    const discountByVendor = new Map<string, number>();
    let remaining = totalDiscountCents;
    applicableSubtotals.forEach((v, index) => {
      const isLast = index === applicableSubtotals.length - 1;
      const share = isLast
        ? remaining
        : Math.round((v.subtotalCents / applicableTotalCents) * totalDiscountCents);
      discountByVendor.set(v.vendorId, share);
      remaining -= share;
    });

    return { coupon, totalDiscountCents, discountByVendor };
  }

  async recordRedemption(
    couponId: string,
    userId: string,
    orderGroupId: string,
    discountCents: number,
  ) {
    await this.prisma.couponRedemption.create({
      data: { couponId, userId, orderGroupId, discountCents },
    });
  }
}
