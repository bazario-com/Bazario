import { Controller, Get } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AdminDashboardService } from './admin-dashboard.service';
import { Roles } from '../../../common/decorators/roles.decorator';

@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @Get('summary')
  getSummary() {
    return this.adminDashboardService.getSummary();
  }
}
