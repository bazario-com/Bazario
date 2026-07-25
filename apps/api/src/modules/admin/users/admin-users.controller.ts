import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AdminUsersService } from './admin-users.service';
import { SetActiveDto } from './dto/set-active.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../../common/decorators/current-user.decorator';

@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  findAll(@Query('role') role?: string) {
    return this.adminUsersService.findAll(role);
  }

  @Patch(':id/active')
  setActive(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SetActiveDto,
  ) {
    return this.adminUsersService.setActive(admin.id, id, dto.isActive);
  }
}
