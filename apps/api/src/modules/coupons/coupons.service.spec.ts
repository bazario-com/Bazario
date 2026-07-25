import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('CouponsService', () => {
  let service: CouponsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      coupon: { findUnique: jest.fn(), create: jest.fn() },
      couponRedemption: { count: jest.fn().mockResolvedValue(0), create: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [CouponsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(CouponsService);
  });

  it('throws NotFoundException for an unknown or inactive coupon', async () => {
    prisma.coupon.findUnique.mockResolvedValue(null);
    await expect(service.validateAndCalculate('BADCODE', 'user-1', [])).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects an expired coupon', async () => {
    prisma.coupon.findUnique.mockResolvedValue({
      id: 'c1',
      isActive: true,
      startsAt: null,
      expiresAt: new Date(Date.now() - 1000),
      maxRedemptions: null,
      vendorId: null,
      minOrderCents: 0,
      discountType: 'PERCENTAGE',
      discountValue: 10,
    });

    await expect(
      service.validateAndCalculate('EXPIRED10', 'user-1', [
        { vendorId: 'v1', subtotalCents: 10000 },
      ]),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects when the cart total is below minOrderCents', async () => {
    prisma.coupon.findUnique.mockResolvedValue({
      id: 'c1',
      isActive: true,
      startsAt: null,
      expiresAt: null,
      maxRedemptions: null,
      vendorId: null,
      minOrderCents: 500000,
      discountType: 'FIXED',
      discountValue: 1000,
    });

    await expect(
      service.validateAndCalculate('BIGORDER', 'user-1', [
        { vendorId: 'v1', subtotalCents: 10000 },
      ]),
    ).rejects.toThrow(BadRequestException);
  });

  it('applies a vendor-scoped coupon only to that vendor\'s subtotal', async () => {
    prisma.coupon.findUnique.mockResolvedValue({
      id: 'c1',
      isActive: true,
      startsAt: null,
      expiresAt: null,
      maxRedemptions: null,
      vendorId: 'v1',
      minOrderCents: 0,
      discountType: 'PERCENTAGE',
      discountValue: 20,
    });

    const result = await service.validateAndCalculate('VENDOR20', 'user-1', [
      { vendorId: 'v1', subtotalCents: 10000 },
      { vendorId: 'v2', subtotalCents: 5000 },
    ]);

    expect(result.totalDiscountCents).toBe(2000); // 20% of v1's 10000 only
    expect(result.discountByVendor.get('v1')).toBe(2000);
    expect(result.discountByVendor.has('v2')).toBe(false);
  });

  it('distributes a platform-wide discount pro-rata across all vendors', async () => {
    prisma.coupon.findUnique.mockResolvedValue({
      id: 'c1',
      isActive: true,
      startsAt: null,
      expiresAt: null,
      maxRedemptions: null,
      vendorId: null,
      minOrderCents: 0,
      discountType: 'FIXED',
      discountValue: 3000,
    });

    const result = await service.validateAndCalculate('PLATFORM30', 'user-1', [
      { vendorId: 'v1', subtotalCents: 15000 }, // 75% of cart
      { vendorId: 'v2', subtotalCents: 5000 }, // 25% of cart
    ]);

    expect(result.totalDiscountCents).toBe(3000);
    expect(result.discountByVendor.get('v1')).toBe(2250); // 75% of 3000
    expect(result.discountByVendor.get('v2')).toBe(750); // remainder, avoids rounding loss
    // Sanity: shares must sum exactly to the total discount (no cents lost to rounding)
    const sum = [...result.discountByVendor.values()].reduce((a, b) => a + b, 0);
    expect(sum).toBe(result.totalDiscountCents);
  });

  it('rejects a percentage discount over 100 at creation time', async () => {
    await expect(
      service.create(null, {
        code: 'TOOBIG',
        discountType: 'PERCENTAGE' as any,
        discountValue: 150,
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
