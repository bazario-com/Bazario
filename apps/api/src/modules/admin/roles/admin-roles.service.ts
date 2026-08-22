import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpsertRoleDto } from './dto/upsert-role.dto';

@Injectable()
export class AdminRolesService {
  constructor(private readonly prisma: PrismaService) {}

  // Defense in depth: role/permission definitions stay Super-Admin-only
  // regardless of what the permission system itself would otherwise allow —
  // a management account should never be able to grant itself more power.
  private assertSuperAdmin(actorRole: string) {
    if (actorRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only the Super Admin can manage roles and permissions');
    }
  }

  findAll() {
    return this.prisma.adminRole.findMany({
      orderBy: { name: 'asc' },
      include: { permissions: true, _count: { select: { assignments: true } } },
    });
  }

  async create(actorRole: string, dto: UpsertRoleDto) {
    this.assertSuperAdmin(actorRole);

    const existing = await this.prisma.adminRole.findUnique({ where: { name: dto.name } });
    if (existing) throw new BadRequestException('A role with that name already exists');

    return this.prisma.adminRole.create({
      data: {
        name: dto.name,
        description: dto.description,
        permissions: { create: dto.permissions.map((permission) => ({ permission })) },
      },
      include: { permissions: true },
    });
  }

  async update(actorRole: string, roleId: string, dto: UpsertRoleDto) {
    this.assertSuperAdmin(actorRole);

    const role = await this.prisma.adminRole.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');

    return this.prisma.$transaction(async (tx) => {
      await tx.adminRolePermission.deleteMany({ where: { roleId } });
      return tx.adminRole.update({
        where: { id: roleId },
        data: {
          name: dto.name,
          description: dto.description,
          permissions: { create: dto.permissions.map((permission) => ({ permission })) },
        },
        include: { permissions: true },
      });
    });
  }

  async remove(actorRole: string, roleId: string) {
    this.assertSuperAdmin(actorRole);

    const role = await this.prisma.adminRole.findUnique({
      where: { id: roleId },
      include: { _count: { select: { assignments: true } } },
    });
    if (!role) throw new NotFoundException('Role not found');
    if (role._count.assignments > 0) {
      throw new BadRequestException(
        'This role is still assigned to a management user — reassign them first',
      );
    }

    await this.prisma.adminRole.delete({ where: { id: roleId } });
    return { success: true };
  }
}
