import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(role?: string) {
    return this.prisma.user.findMany({
      where: role ? { role: role as any } : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        phone: true,
        createdAt: true,
        lastLoginAt: true,
      },
      take: 200, // simple cap for this phase — full pagination/search lands with the admin UI's table component
    });
  }

  async setActive(actingAdminId: string, targetUserId: string, isActive: boolean) {
    if (actingAdminId === targetUserId) {
      throw new BadRequestException('You cannot deactivate your own account');
    }

    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException('User not found');

    if (target.role === 'SUPER_ADMIN' && !isActive) {
      throw new BadRequestException('Super admin accounts cannot be deactivated from this panel');
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { isActive },
      select: { id: true, email: true, isActive: true },
    });

    if (!isActive) {
      // Revokes refresh tokens so they can't get a new session — their
      // current access token (max 15 min) still works until it naturally
      // expires, since JwtAuthGuard only checks the signature/expiry, not
      // a live isActive flag. Acceptable given the short access-token TTL;
      // an instant-revoke path would need a token blocklist.
      await this.prisma.refreshToken.updateMany({
        where: { userId: targetUserId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    return updated;
  }

  async exportToExcel() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        vendor: { select: { businessName: true, store: { select: { address: true, city: true, contactPhone: true } } } },
      },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Contacts');
    sheet.columns = [
      { header: 'First Name', key: 'firstName', width: 18 },
      { header: 'Last Name', key: 'lastName', width: 18 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 18 },
      { header: 'Role', key: 'role', width: 12 },
      { header: 'Active', key: 'isActive', width: 10 },
      { header: 'Business Name', key: 'businessName', width: 24 },
      { header: 'Shop Address', key: 'address', width: 30 },
      { header: 'City', key: 'city', width: 16 },
      { header: 'Shop Contact', key: 'shopContact', width: 18 },
      { header: 'Joined', key: 'createdAt', width: 20 },
    ];

    for (const u of users) {
      sheet.addRow({
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        phone: u.phone ?? '',
        role: u.role,
        isActive: u.isActive ? 'Yes' : 'No',
        businessName: u.vendor?.businessName ?? '',
        address: u.vendor?.store?.address ?? '',
        city: u.vendor?.store?.city ?? '',
        shopContact: u.vendor?.store?.contactPhone ?? '',
        createdAt: u.createdAt.toISOString().slice(0, 10),
      });
    }

    return workbook.xlsx.writeBuffer();
  }
}
