import { ExecutionContext, Injectable, CanActivate, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminPermission } from '@prisma/client';
import { REQUIRE_PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { PermissionsService } from '../../modules/admin/rbac/permissions.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<AdminPermission | undefined>(
      REQUIRE_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required) return true; // no permission requirement on this route

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('You do not have permission to access this resource');

    const allowed = await this.permissionsService.hasPermission(user.id, user.role, required);
    if (!allowed) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }
    return true;
  }
}
