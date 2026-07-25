import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CouponsService } from '../coupons/coupons.service';

describe('OrdersService.checkout', () => {
  let service: OrdersService;
  let prisma: any;
  let couponsService: jest.Mocked<Partial<CouponsService>>;

  const baseCartItem = (overrides: Partial<any> = {}) => ({
    id: 'item-1',
    cartId: 'cart-1',
    productId: 'p1',
    variantId: 'v1',
    quantity: 2,
    product: { id: 'p1', title: 'Wireless Mouse', vendorId: 'vendor-1' },
    variant: { id: 'v1', priceCents: 1000, optionsJson: {}, stockQuantity: 10 },
    ...overrides,
  });

  beforeEach(async () => {
    const tx = {
      productVariant: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      product: { update: jest.fn() },
      order: { create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'order-1', ...data })) },
      cartItem: { deleteMany: jest.fn() },
    };

    prisma = {
      address: { findFirst: jest.fn() },
      cart: { findUnique: jest.fn() },
      $transaction: jest.fn((cb) => cb(tx)),
      __tx: tx,
    };

    couponsService = {
      validateAndCalculate: jest.fn(),
      recordRedemption: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: CouponsService, useValue: couponsService },
      ],
    }).compile();

    service = module.get(OrdersService);
  });

  it('rejects any payment method other than COD (not yet implemented)', async () => {
    await expect(
      service.checkout('user-1', { addressId: 'addr-1', paymentMethod: 'CARD' as any }),
    ).rejects.toThrow(NotImplementedException);
  });

  it('rejects checkout against an address that does not belong to the user', async () => {
    prisma.address.findFirst.mockResolvedValue(null);
    await expect(
      service.checkout('user-1', { addressId: 'not-mine', paymentMethod: 'COD' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects checkout with an empty cart', async () => {
    prisma.address.findFirst.mockResolvedValue({ id: 'addr-1', userId: 'user-1' });
    prisma.cart.findUnique.mockResolvedValue({ id: 'cart-1', items: [] });

    await expect(
      service.checkout('user-1', { addressId: 'addr-1', paymentMethod: 'COD' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('fails the whole transaction if stock runs out mid-checkout', async () => {
    prisma.address.findFirst.mockResolvedValue({ id: 'addr-1', userId: 'user-1' });
    prisma.cart.findUnique.mockResolvedValue({ id: 'cart-1', items: [baseCartItem()] });
    prisma.__tx.productVariant.updateMany.mockResolvedValue({ count: 0 }); // stock check fails

    await expect(
      service.checkout('user-1', { addressId: 'addr-1', paymentMethod: 'COD' }),
    ).rejects.toThrow(BadRequestException);

    // Cart must NOT be cleared if the transaction failed partway through
    expect(prisma.__tx.cartItem.deleteMany).not.toHaveBeenCalled();
  });

  it('splits a multi-vendor cart into one order per vendor, sharing an orderGroupId', async () => {
    const items = [
      baseCartItem({ id: 'item-1', product: { id: 'p1', title: 'Mouse', vendorId: 'vendor-A' } }),
      baseCartItem({ id: 'item-2', productId: 'p2', variantId: 'v2', product: { id: 'p2', title: 'Keyboard', vendorId: 'vendor-B' } }),
    ];
    prisma.address.findFirst.mockResolvedValue({ id: 'addr-1', userId: 'user-1' });
    prisma.cart.findUnique.mockResolvedValue({ id: 'cart-1', items });

    const orders = await service.checkout('user-1', { addressId: 'addr-1', paymentMethod: 'COD' });

    expect(orders).toHaveLength(2);
    expect(orders[0].orderGroupId).toBe(orders[1].orderGroupId);
    expect(orders.map((o: any) => o.vendorId).sort()).toEqual(['vendor-A', 'vendor-B']);
    expect(prisma.__tx.cartItem.deleteMany).toHaveBeenCalledWith({ where: { cartId: 'cart-1' } });
  });

  it('applies a validated coupon discount to the resulting order total and records redemption', async () => {
    prisma.address.findFirst.mockResolvedValue({ id: 'addr-1', userId: 'user-1' });
    prisma.cart.findUnique.mockResolvedValue({ id: 'cart-1', items: [baseCartItem()] }); // subtotal = 2000

    (couponsService.validateAndCalculate as jest.Mock).mockResolvedValue({
      coupon: { id: 'coupon-1' },
      totalDiscountCents: 500,
      discountByVendor: new Map([['vendor-1', 500]]),
    });

    const orders = await service.checkout('user-1', {
      addressId: 'addr-1',
      paymentMethod: 'COD',
      couponCode: 'SAVE500',
    });

    expect(orders[0].discountCents).toBe(500);
    expect(orders[0].totalCents).toBe(1500);
    expect(couponsService.recordRedemption).toHaveBeenCalledWith(
      'coupon-1',
      'user-1',
      expect.any(String),
      500,
    );
  });
});
