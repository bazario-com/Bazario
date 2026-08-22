import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminVendorsService } from './admin-vendors.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../rbac/audit-log.service';

describe('AdminVendorsService', () => {
  let service: AdminVendorsService;
  let prisma: any;
  let auditLog: any;

  beforeEach(async () => {
    prisma = { vendor: { findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() } };
    auditLog = { log: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminVendorsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditLogService, useValue: auditLog },
      ],
    }).compile();
    service = module.get(AdminVendorsService);
  });

  it('throws NotFoundException approving a vendor that does not exist', async () => {
    prisma.vendor.findUnique.mockResolvedValue(null);
    await expect(service.approve('missing', 'admin-1')).rejects.toThrow(NotFoundException);
  });

  it('rejects re-approving an already-approved vendor', async () => {
    prisma.vendor.findUnique.mockResolvedValue({ id: 'v1', status: 'APPROVED' });
    await expect(service.approve('v1', 'admin-1')).rejects.toThrow(BadRequestException);
  });

  it('approving a vendor sets status APPROVED and clears any prior rejection reason', async () => {
    prisma.vendor.findUnique.mockResolvedValue({ id: 'v1', status: 'PENDING', businessName: 'Test Co' });
    prisma.vendor.update.mockResolvedValue({ id: 'v1', status: 'APPROVED' });

    await service.approve('v1', 'admin-1');

    const updateArg = prisma.vendor.update.mock.calls[0][0];
    expect(updateArg.data.status).toBe('APPROVED');
    expect(updateArg.data.rejectedReason).toBeNull();
    expect(auditLog.log).toHaveBeenCalledWith('admin-1', 'APPROVE_VENDOR', expect.any(Object));
  });

  it('rejecting a vendor records the reason', async () => {
    prisma.vendor.findUnique.mockResolvedValue({ id: 'v1', status: 'PENDING', businessName: 'Test Co' });
    prisma.vendor.update.mockResolvedValue({ id: 'v1', status: 'REJECTED' });

    await service.reject('v1', 'Incomplete business documents', 'admin-1');

    expect(prisma.vendor.update).toHaveBeenCalledWith({
      where: { id: 'v1' },
      data: { status: 'REJECTED', rejectedReason: 'Incomplete business documents' },
    });
    expect(auditLog.log).toHaveBeenCalledWith('admin-1', 'REJECT_VENDOR', expect.any(Object));
  });
});
