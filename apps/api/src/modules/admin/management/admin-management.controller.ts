import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AdminManagementService } from './admin-management.service';
import { CreateManagementUserDto } from './dto/create-management-user.dto';
import { SetPermissionOverrideDto } from './dto/set-permission-override.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { CurrentUser, AuthenticatedUser } from '../../../common/decorators/current-user.decorator';

@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@RequirePermission('MANAGE_ADMIN_USERS')
@Controller('admin/management')
export class AdminManagementController {
  constructor(private readonly adminManagementService: AdminManagementService) {}

  @Get()
  listTeam() {
    return this.adminManagementService.listTeam();
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateManagementUserDto) {
    return this.adminManagementService.create(user.id, user.role, dto);
  }

  @Patch(':userId/role')
  assignRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId') userId: string,
    @Body('roleId') roleId: string,
  ) {
    return this.adminManagementService.assignRole(user.id, user.role, userId, roleId);
  }

  @Patch(':userId/override')
  setOverride(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId') userId: string,
    @Body() dto: SetPermissionOverrideDto,
  ) {
    return this.adminManagementService.setOverride(user.id, user.role, userId, dto);
  }

  @Patch(':userId/status')
  setStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId') userId: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.adminManagementService.setStatus(user.id, user.role, userId, isActive);
  }
}
