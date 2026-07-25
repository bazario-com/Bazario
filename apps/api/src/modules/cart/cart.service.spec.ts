import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CartService } from './cart.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('CartService', () => {
  let service: CartService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      cart: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      cartItem: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn(),
      },
      productVariant: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [CartService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(CartService);
  });

  it('throws NotFoundException when the variant does not exist', async () => {
    prisma.productVariant.findUnique.mockResolvedValue(null);
    await expect(service.addItem('user-1', 'variant-x', 1)).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when the parent product is not published', async () => {
    prisma.productVariant.findUnique.mockResolvedValue({
      id: 'v1',
      isActive: true,
      stockQuantity: 10,
      product: { status: 'DRAFT' },
    });
    await expect(service.addItem('user-1', 'v1', 1)).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when requested quantity exceeds stock', async () => {
    prisma.productVariant.findUnique.mockResolvedValue({
      id: 'v1',
      isActive: true,
      stockQuantity: 2,
      product: { status: 'PUBLISHED' },
    });
    prisma.cart.findUnique.mockResolvedValue({ id: 'cart-1', userId: 'user-1' });
    prisma.cartItem.findUnique.mockResolvedValue(null);

    await expect(service.addItem('user-1', 'v1', 5)).rejects.toThrow(BadRequestException);
  });

  it('sums existing quantity with new quantity when checking stock', async () => {
    prisma.productVariant.findUnique.mockResolvedValue({
      id: 'v1',
      productId: 'p1',
      isActive: true,
      stockQuantity: 5,
      product: { status: 'PUBLISHED' },
    });
    prisma.cart.findUnique.mockResolvedValue({ id: 'cart-1', userId: 'user-1' });
    prisma.cartItem.findUnique.mockResolvedValue({ id: 'item-1', quantity: 3 });

    // 3 already in cart + 3 more requested = 6, which exceeds stock of 5
    await expect(service.addItem('user-1', 'v1', 3)).rejects.toThrow(BadRequestException);
  });
});
