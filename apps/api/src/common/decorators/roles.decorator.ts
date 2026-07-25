import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

// Usage: @Roles(Role.ADMIN, Role.VENDOR) on a controller method, combined
// with RolesGuard, restricts that route to the listed roles.
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
