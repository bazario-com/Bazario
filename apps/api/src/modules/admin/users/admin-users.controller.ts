import { Body, Controller, Get, Param, Patch, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
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

  @Get('export')
  async exportToExcel(@Res() res: Response) {
    const buffer = await this.adminUsersService.exportToExcel();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="shopina-contacts-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    });
    res.send(buffer);
  }

  @Patch(':id/active')
  setActive(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SetActiveDto,
  ) {
    return this.adminUsersService.setActive(admin.id, id, dto.isActive);
  }

  // Admin-initiated reset: generates a fresh temporary password and returns
  // it once — it is never stored or logged in plaintext beyond this response.
  @Patch(':id/reset-password')
  resetPassword(@Param('id') id: string) {
    return this.adminUsersService.resetPassword(id);
  }
}
