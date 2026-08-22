import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { AuditLogService } from './audit-log.service';
import { AuditLogController } from './audit-log.controller';

@Module({
  controllers: [AuditLogController],
  providers: [PermissionsService, AuditLogService],
  exports: [PermissionsService, AuditLogService],
})
export class RbacModule {}
