import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('CategoriesService admin CRUD', () => {
  let service: CategoriesService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      category: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [CategoriesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(CategoriesService);
  });

  it('rejects creating a category with a duplicate slug', async () => {
    prisma.category.findUnique.mockResolvedValue({ id: 'existing' });
    await expect(service.create({ name: 'Phones', slug: 'phones' })).rejects.toThrow(
      ConflictException,
    );
  });

  it('rejects deleting a category that still has products or children', async () => {
    prisma.category.findUnique.mockResolvedValue({
      id: 'cat-1',
      _count: { products: 3, children: 0 },
    });
    await expect(service.remove('cat-1')).rejects.toThrow(ConflictException);
    expect(prisma.category.delete).not.toHaveBeenCalled();
  });

  it('allows deleting an empty category', async () => {
    prisma.category.findUnique.mockResolvedValue({
      id: 'cat-1',
      _count: { products: 0, children: 0 },
    });
    prisma.category.delete.mockResolvedValue({ id: 'cat-1' });

    await service.remove('cat-1');
    expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: 'cat-1' } });
  });

  it('throws NotFoundException when updating a category that does not exist', async () => {
    prisma.category.findUnique.mockResolvedValue(null);
    await expect(service.update('missing', { name: 'X' })).rejects.toThrow(NotFoundException);
  });
});
