import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  log(actorId: string, action: string, opts?: { targetType?: string; targetId?: string; details?: object }) {
    // Fire-and-forget from callers' perspective is tempting but risky —
    // audit entries must not silently fail, so callers await this.
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

  list(page = 1, pageSize = 30) {
    return this.prisma.adminAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { actor: { select: { firstName: true, lastName: true, email: true } } },
    });
  }
}
