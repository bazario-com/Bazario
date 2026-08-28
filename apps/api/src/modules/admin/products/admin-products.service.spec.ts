import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminProductsService } from './admin-products.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../rbac/audit-log.service';

describe('AdminProductsService', () => {
  let service: AdminProductsService;
  let prisma: any;
  let auditLog: any;

  beforeEach(async () => {
    prisma = { product: { findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() } };
    auditLog = { log: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminProductsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditLogService, useValue: auditLog },
      ],
    }).compile();
    service = module.get(AdminProductsService);
  });

  it('throws NotFoundException approving a product that does not exist', async () => {
    prisma.product.findUnique.mockResolvedValue(null);
    await expect(service.approve('missing', 'admin-1')).rejects.toThrow(NotFoundException);
  });

  it('rejects re-approving an already-published product', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 'p1', status: 'PUBLISHED' });
    await expect(service.approve('p1', 'admin-1')).rejects.toThrow(BadRequestException);
  });

  it('approving sets PUBLISHED, stamps publishedAt, clears any rejection reason, and logs the action', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 'p1', status: 'PENDING_APPROVAL', title: 'Test Product' });
    prisma.product.update.mockResolvedValue({ id: 'p1', status: 'PUBLISHED' });

    await service.approve('p1', 'admin-1');

    const updateArg = prisma.product.update.mock.calls[0][0];
    expect(updateArg.data.status).toBe('PUBLISHED');
    expect(updateArg.data.publishedAt).toBeInstanceOf(Date);
    expect(updateArg.data.rejectedReason).toBeNull();
    expect(auditLog.log).toHaveBeenCalledWith(
      'admin-1',
      'APPROVE_PRODUCT',
      expect.objectContaining({ targetType: 'Product', targetId: 'p1' }),
    );
  });

  it('rejecting a product records the reason without touching publishedAt, and logs the action', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 'p1', status: 'PENDING_APPROVAL', title: 'Test Product' });
    prisma.product.update.mockResolvedValue({ id: 'p1', status: 'REJECTED' });

    await service.reject('p1', 'Misleading product images', 'admin-1');

    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { status: 'REJECTED', rejectedReason: 'Misleading product images' },
    });
    expect(auditLog.log).toHaveBeenCalledWith(
      'admin-1',
      'REJECT_PRODUCT',
      expect.objectContaining({ targetType: 'Product', targetId: 'p1' }),
    );
  });
});
