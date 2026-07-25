import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { VendorProductsService } from './vendor-products.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('VendorProductsService', () => {
  let service: VendorProductsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      category: { findUnique: jest.fn() },
      product: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
      productVariant: { findFirst: jest.fn(), update: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [VendorProductsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(VendorProductsService);
  });

  it('rejects creating a product against a non-existent category', async () => {
    prisma.category.findUnique.mockResolvedValue(null);
    await expect(
      service.create('vendor-1', {
        title: 'Test',
        categoryId: 'bad-cat',
        description: 'desc',
        basePriceCents: 1000,
        imageUrls: ['https://example.com/a.jpg'],
        variants: [{ sku: 'SKU1', priceCents: 1000, stockQuantity: 5 }],
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('always creates new products with PENDING_APPROVAL status regardless of input', async () => {
    prisma.category.findUnique.mockResolvedValue({ id: 'cat-1' });
    prisma.product.create.mockResolvedValue({ id: 'p1' });

    await service.create('vendor-1', {
      title: 'Test Product',
      categoryId: 'cat-1',
      description: 'desc',
      basePriceCents: 1000,
      imageUrls: ['https://example.com/a.jpg'],
      variants: [{ sku: 'SKU1', priceCents: 1000, stockQuantity: 5 }],
    });

    expect(prisma.product.create.mock.calls[0][0].data.status).toBe('PENDING_APPROVAL');
  });

  it('throws NotFoundException when a vendor tries to access a product they do not own', async () => {
    prisma.product.findFirst.mockResolvedValue(null); // scoped query returns nothing
    await expect(service.findOneForVendor('vendor-1', 'someone-elses-product')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('sends a PUBLISHED product back to PENDING_APPROVAL when the title is edited', async () => {
    prisma.product.findFirst.mockResolvedValue({ id: 'p1', status: 'PUBLISHED' });
    prisma.product.update.mockResolvedValue({ id: 'p1' });

    await service.update('vendor-1', 'p1', { title: 'New Title' });

    const updateArg = prisma.product.update.mock.calls[0][0];
    expect(updateArg.data.status).toBe('PENDING_APPROVAL');
    expect(updateArg.data.publishedAt).toBeNull();
  });

  it('does NOT reset approval status when editing non-public fields like discountPct', async () => {
    prisma.product.findFirst.mockResolvedValue({ id: 'p1', status: 'PUBLISHED' });
    prisma.product.update.mockResolvedValue({ id: 'p1' });

    await service.update('vendor-1', 'p1', { discountPct: 10 });

    const updateArg = prisma.product.update.mock.calls[0][0];
    expect(updateArg.data.status).toBeUndefined();
  });

  it('scopes variant stock updates through the product ownership relation', async () => {
    prisma.productVariant.findFirst.mockResolvedValue(null); // not owned by this vendor
    await expect(
      service.updateVariantStock('vendor-1', 'variant-not-mine', 10),
    ).rejects.toThrow(NotFoundException);
  });
});
