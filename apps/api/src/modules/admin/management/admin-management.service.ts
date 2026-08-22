import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as argon2 from 'argon2';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../rbac/audit-log.service';
import { CreateManagementUserDto } from './dto/create-management-user.dto';
import { SetPermissionOverrideDto } from './dto/set-permission-override.dto';

@Injectable()
export class AdminManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  // Every mutating method here is Super-Admin-only, checked explicitly —
  // not just via the permission system — because this module can create
  // and modify other admin accounts, making it the highest-risk surface
  // in the whole app. A management account must never reach these routes
  // even with a misconfigured role.
  private assertSuperAdmin(actorRole: string) {
    if (actorRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only the Super Admin can manage the admin team');
    }
  }

  listTeam() {
    return this.prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        adminRoleAssignment: {
          include: { role: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(actorId: string, actorRole: string, dto: CreateManagementUserDto) {
    this.assertSuperAdmin(actorRole);

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('A user with that email already exists');

    const role = await this.prisma.adminRole.findUnique({ where: { id: dto.roleId } });
    if (!role) throw new NotFoundException('Role not found');

    const tempPassword = `${randomBytes(6).toString('hex')}Aa1!`;
    const passwordHash = await argon2.hash(tempPassword, { type: argon2.argon2id });

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          passwordHash,
          role: 'ADMIN', // never SUPER_ADMIN — see class-level note
        },
      });
      await tx.adminRoleAssignment.create({
        data: { userId: created.id, roleId: dto.roleId, assignedBy: actorId },
      });
      return created;
    });

    await this.auditLog.log(actorId, 'CREATE_MANAGEMENT_USER', {
      targetType: 'User',
      targetId: user.id,
      details: { email: user.email, roleId: dto.roleId, roleName: role.name },
    });

    return { id: user.id, email: user.email, temporaryPassword: tempPassword };
  }

  async assignRole(actorId: string, actorRole: string, userId: string, roleId: string) {
    this.assertSuperAdmin(actorRole);

    const target = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!target) throw new NotFoundException('User not found');
    if (target.role === 'SUPER_ADMIN') {
      throw new ForbiddenException("The Super Admin's own access cannot be restricted");
    }

    const role = await this.prisma.adminRole.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');

    const assignment = await this.prisma.adminRoleAssignment.upsert({
      where: { userId },
      update: { roleId, assignedBy: actorId, assignedAt: new Date() },
      create: { userId, roleId, assignedBy: actorId },
    });

    await this.auditLog.log(actorId, 'REASSIGN_ROLE', {
      targetType: 'User',
      targetId: userId,
      details: { newRoleId: roleId, newRoleName: role.name },
    });

    return assignment;
  }

  async setOverride(actorId: string, actorRole: string, userId: string, dto: SetPermissionOverrideDto) {
    this.assertSuperAdmin(actorRole);

    const target = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!target) throw new NotFoundException('User not found');
    if (target.role === 'SUPER_ADMIN') {
      throw new ForbiddenException("The Super Admin's own access cannot be restricted");
    }

    const override = await this.prisma.adminPermissionOverride.upsert({
      where: { userId_permission: { userId, permission: dto.permission } },
      update: { granted: dto.granted },
      create: { userId, permission: dto.permission, granted: dto.granted },
    });

    await this.auditLog.log(actorId, 'SET_PERMISSION_OVERRIDE', {
      targetType: 'User',
      targetId: userId,
      details: { permission: dto.permission, granted: dto.granted },
    });

    return override;
  }

  async setStatus(actorId: string, actorRole: string, userId: string, isActive: boolean) {
    this.assertSuperAdmin(actorRole);

    const target = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!target) throw new NotFoundException('User not found');
    if (target.role === 'SUPER_ADMIN') {
      throw new ForbiddenException('The Super Admin account cannot be suspended');
    }

    const updated = await this.prisma.user.update({ where: { id: userId }, data: { isActive } });

    await this.auditLog.log(actorId, isActive ? 'REACTIVATE_MANAGEMENT_USER' : 'SUSPEND_MANAGEMENT_USER', {
      targetType: 'User',
      targetId: userId,
    });

    return updated;
  }
}
