import { Controller, Get, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuditLogService } from './audit-log.service';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@RequirePermission('VIEW_AUDIT_LOGS')
@Controller('admin/audit-log')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  list(@Query('page') page?: string) {
    return this.auditLogService.list(page ? parseInt(page, 10) : 1);
  }
}
