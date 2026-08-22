import { SetMetadata } from '@nestjs/common';
import { AdminPermission } from '@prisma/client';

export const REQUIRE_PERMISSION_KEY = 'requirePermission';
export const RequirePermission = (permission: AdminPermission) =>
  SetMetadata(REQUIRE_PERMISSION_KEY, permission);
