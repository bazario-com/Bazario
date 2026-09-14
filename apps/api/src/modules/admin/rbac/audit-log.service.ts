import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  log(actorId: string, action: string, opts?: { targetType?: string; targetId?: string; details?: object }) {
    return this.prisma.adminAuditLog.create({
      data: {
        actorId,
        action,
        targetType: opts?.targetType,
        targetId: opts?.targetId,
        details: opts?.details as any,
      },
    });
  }

  async list(page = 1, pageSize = 30) {
    const [entries, total] = await Promise.all([
      this.prisma.adminAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { actor: { select: { firstName: true, lastName: true, email: true } } },
      }),
      this.prisma.adminAuditLog.count(),
    ]);
    return { entries, total, page, pageSize };
  }

  listForActor(actorId: string, limit = 10) {
    return this.prisma.adminAuditLog.findMany({
      where: { actorId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
