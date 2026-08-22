import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../rbac/audit-log.service';

describe('AdminUsersService', () => {
  let service: AdminUsersService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() },
      refreshToken: { updateMany: jest.fn() },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminUsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditLogService, useValue: { log: jest.fn() } },
      ],
    }).compile();
    service = module.get(AdminUsersService);
  });

  it('prevents an admin from deactivating their own account', async () => {
    await expect(service.setActive('admin-1', 'admin-1', false)).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('throws NotFoundException for a non-existent target user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.setActive('admin-1', 'missing', false)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('prevents deactivating a SUPER_ADMIN account', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', role: 'SUPER_ADMIN' });
    await expect(service.setActive('admin-1', 'u1', false)).rejects.toThrow(BadRequestException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('revokes active refresh tokens when a user is deactivated', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', role: 'CUSTOMER' });
    prisma.user.update.mockResolvedValue({ id: 'u1', isActive: false });

    await service.setActive('admin-1', 'u1', false);

    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 'u1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it('does not touch refresh tokens when reactivating a user', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', role: 'CUSTOMER' });
    prisma.user.update.mockResolvedValue({ id: 'u1', isActive: true });

    await service.setActive('admin-1', 'u1', true);

    expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
  });
});
