import { Module } from '@nestjs/common';
import { AdminRolesService } from './admin-roles.service';
import { AdminRolesController } from './admin-roles.controller';

@Module({
  controllers: [AdminRolesController],
  providers: [AdminRolesService],
})
export class AdminRolesModule {}
