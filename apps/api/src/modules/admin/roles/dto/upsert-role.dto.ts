import { IsArray, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { AdminPermission } from '@prisma/client';

export class UpsertRoleDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @IsArray()
  @IsEnum(AdminPermission, { each: true })
  permissions: AdminPermission[];
}
