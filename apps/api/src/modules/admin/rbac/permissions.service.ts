import { Injectable } from '@nestjs/common';
import { AdminPermission } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

// Sentinel distinguishing "unrestricted legacy admin" from "restricted
// management account with an explicit set of permissions" — kept distinct
// from a Set so callers can't accidentally treat FULL_ACCESS as just a
// large permission list.
export const FULL_ACCESS = Symbol('FULL_ACCESS');
export type EffectivePermissions = typeof FULL_ACCESS | Set<AdminPermission>;

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getEffectivePermissions(userId: string, role: string): Promise<EffectivePermissions> {
    // SUPER_ADMIN is always unrestricted — this can never be overridden,
    // by design (see "Super Admin protection" requirements).
    if (role === 'SUPER_ADMIN') return FULL_ACCESS;
    if (role !== 'ADMIN') return new Set();

    const assignment = await this.prisma.adminRoleAssignment.findUnique({
      where: { userId },
      include: { role: { include: { permissions: true } } },
    });

    // A plain ADMIN with no scoped role assignment is a legacy/full admin —
    // preserves behaviour for every admin account that existed before this
    // system was introduced.
    if (!assignment) return FULL_ACCESS;

    const permissions = new Set(assignment.role.permissions.map((p) => p.permission));

    const overrides = await this.prisma.adminPermissionOverride.findMany({ where: { userId } });
    for (const o of overrides) {
      if (o.granted) permissions.add(o.permission);
      else permissions.delete(o.permission);
    }

    return permissions;
  }

  async hasPermission(userId: string, role: string, permission: AdminPermission): Promise<boolean> {
    const effective = await this.getEffectivePermissions(userId, role);
    return effective === FULL_ACCESS || effective.has(permission);
  }
}
