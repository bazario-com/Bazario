import { Controller, Get, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PermissionsService } from './permissions.service';
import { AuditLogService } from './audit-log.service';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../../common/decorators/current-user.decorator';

// Deliberately NOT gated by @RequirePermission — every admin needs to know
// their own access to render a personalized experience, distinct from
// admin/management (which requires MANAGE_ADMIN_USERS to see *others*).
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('admin/me')
export class MyAccessController {
  constructor(
    private readonly permissionsService: PermissionsService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Get('access')
  getMyAccess(@CurrentUser() user: AuthenticatedUser) {
    return this.permissionsService.getMyAccess(user.id, user.role);
  }

  // Same "own data only" principle as /admin/me/access: every admin can see
  // their own recent actions without the VIEW_AUDIT_LOGS permission that
  // gates the full, all-admins /admin/audit-log view.
  @Get('activity')
  getMyActivity(@CurrentUser() user: AuthenticatedUser, @Query('limit') limit?: string) {
    return this.auditLog.listForActor(user.id, limit ? parseInt(limit, 10) : 10);
  }
}
