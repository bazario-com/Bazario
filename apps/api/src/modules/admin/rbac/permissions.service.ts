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

  // Lets the frontend render a personalized experience — every admin can
  // see their own access, distinct from the MANAGE_ADMIN_USERS-gated view
  // of *other* people's access.
  async getMyAccess(userId: string, role: string) {
    if (role === 'SUPER_ADMIN') {
      return { isFullAccess: true, roleName: 'Super Admin', permissions: [] };
    }

    const assignment = await this.prisma.adminRoleAssignment.findUnique({
      where: { userId },
      include: { role: { include: { permissions: true } } },
    });

    if (!assignment) {
      return { isFullAccess: true, roleName: 'Admin (unrestricted)', permissions: [] };
    }

    const effective = await this.getEffectivePermissions(userId, role);
    return {
      isFullAccess: false,
      roleName: assignment.role.name,
      roleDescription: assignment.role.description,
      permissions: effective === FULL_ACCESS ? [] : Array.from(effective),
    };
  }
}
