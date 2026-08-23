import { Controller, Get } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PermissionsService } from './permissions.service';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../../common/decorators/current-user.decorator';

// Deliberately NOT gated by @RequirePermission — every admin needs to know
// their own access to render a personalized experience, distinct from
// admin/management (which requires MANAGE_ADMIN_USERS to see *others*).
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('admin/me')
export class MyAccessController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get('access')
  getMyAccess(@CurrentUser() user: AuthenticatedUser) {
    return this.permissionsService.getMyAccess(user.id, user.role);
  }
}
