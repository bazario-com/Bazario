import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { AuditLogService } from './audit-log.service';
import { AuditLogController } from './audit-log.controller';
import { MyAccessController } from './my-access.controller';
import { NotificationsService } from './notifications.service';
import { AdminSearchService } from './admin-search.service';

@Module({
  controllers: [AuditLogController, MyAccessController],
  providers: [PermissionsService, AuditLogService, NotificationsService, AdminSearchService],
  exports: [PermissionsService, AuditLogService],
})
export class RbacModule {}
