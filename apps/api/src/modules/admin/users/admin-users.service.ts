import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
}
