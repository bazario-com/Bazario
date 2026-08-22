import { Module } from '@nestjs/common';
import { AdminVendorsService } from './vendors/admin-vendors.service';
import { AdminVendorsController } from './vendors/admin-vendors.controller';
import { AdminProductsService } from './products/admin-products.service';
import { AdminProductsController } from './products/admin-products.controller';
import { AdminUsersService } from './users/admin-users.service';
import { AdminUsersController } from './users/admin-users.controller';
import { AdminDashboardService } from './dashboard/admin-dashboard.service';
import { AdminDashboardController } from './dashboard/admin-dashboard.controller';
import { AdminAnnouncementsService } from './announcements/admin-announcements.service';
import { AdminAnnouncementsController } from './announcements/admin-announcements.controller';
import { AnnouncementsPublicController } from './announcements/announcements-public.controller';
import { RbacModule } from './rbac/rbac.module';

@Module({
  imports: [RbacModule],
  controllers: [
    AdminVendorsController,
    AdminProductsController,
    AdminUsersController,
    AdminDashboardController,
    AdminAnnouncementsController,
    AnnouncementsPublicController,
  ],
  providers: [AdminVendorsService, AdminProductsService, AdminUsersService, AdminDashboardService, AdminAnnouncementsService],
})
export class AdminModule {}
