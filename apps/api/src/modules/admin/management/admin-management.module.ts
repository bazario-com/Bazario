import { Module } from '@nestjs/common';
import { AdminManagementService } from './admin-management.service';
import { AdminManagementController } from './admin-management.controller';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [RbacModule],
  controllers: [AdminManagementController],
  providers: [AdminManagementService],
})
export class AdminManagementModule {}
