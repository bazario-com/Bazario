import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductSort } from './dto/list-products.dto';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      product: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      $transaction: jest.fn((ops) => Promise.all(ops)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(ProductsService);
  });

  it('only queries published, non-deleted products', async () => {
    await service.list({ page: 1, pageSize: 24, sort: ProductSort.NEWEST });

    const whereArg = prisma.product.findMany.mock.calls[0][0].where;
    expect(whereArg.status).toBe('PUBLISHED');
    expect(whereArg.deletedAt).toBeNull();
  });

  it('applies category filter by slug', async () => {
    await service.list({ categorySlug: 'mobiles', page: 1, pageSize: 24 });
    const whereArg = prisma.product.findMany.mock.calls[0][0].where;
    expect(whereArg.category).toEqual({ slug: 'mobiles' });
  });

  it('computes pagination metadata correctly', async () => {
    prisma.product.count.mockResolvedValue(50);
    const result = await service.list({ page: 2, pageSize: 20 });

    expect(result.pagination).toEqual({
      page: 2,
      pageSize: 20,
      total: 50,
      totalPages: 3,
    });
    expect(prisma.product.findMany.mock.calls[0][0].skip).toBe(20);
    expect(prisma.product.findMany.mock.calls[0][0].take).toBe(20);
  });

  it('maps price sort options to the correct orderBy clause', async () => {
    await service.list({ sort: ProductSort.PRICE_ASC, page: 1, pageSize: 24 });
    expect(prisma.product.findMany.mock.calls[0][0].orderBy).toEqual({
      basePriceCents: 'asc',
    });
  });
});
