import { IsBoolean, IsEnum } from 'class-validator';
import { AdminPermission } from '@prisma/client';

export class SetPermissionOverrideDto {
  @IsEnum(AdminPermission)
  permission: AdminPermission;

  @IsBoolean()
  granted: boolean;
}
