import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AdminRolesService } from './admin-roles.service';
import { UpsertRoleDto } from './dto/upsert-role.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { CurrentUser, AuthenticatedUser } from '../../../common/decorators/current-user.decorator';

@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@RequirePermission('MANAGE_ROLES_PERMISSIONS')
@Controller('admin/roles')
export class AdminRolesController {
  constructor(private readonly adminRolesService: AdminRolesService) {}

  @Get()
  findAll() {
    return this.adminRolesService.findAll();
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpsertRoleDto) {
    return this.adminRolesService.create(user.role, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpsertRoleDto,
  ) {
    return this.adminRolesService.update(user.role, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.adminRolesService.remove(user.role, id);
  }
}
