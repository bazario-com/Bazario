import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { AuditLogService } from './audit-log.service';
import { AuditLogController } from './audit-log.controller';
import { MyAccessController } from './my-access.controller';

@Module({
  controllers: [AuditLogController, MyAccessController],
  providers: [PermissionsService, AuditLogService],
  exports: [PermissionsService, AuditLogService],
})
export class RbacModule {}
