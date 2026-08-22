import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AdminAnnouncementsService } from './admin-announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('admin/announcements')
export class AdminAnnouncementsController {
  constructor(private readonly adminAnnouncementsService: AdminAnnouncementsService) {}

  @RequirePermission('VIEW_ANNOUNCEMENTS')
  @Get()
  findAll() {
    return this.adminAnnouncementsService.findAll();
  }

  @RequirePermission('MANAGE_ANNOUNCEMENTS')
  @Post()
  create(@Body() dto: CreateAnnouncementDto) {
    return this.adminAnnouncementsService.create(dto);
  }

  @RequirePermission('MANAGE_ANNOUNCEMENTS')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAnnouncementDto) {
    return this.adminAnnouncementsService.update(id, dto);
  }

  @RequirePermission('MANAGE_ANNOUNCEMENTS')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminAnnouncementsService.remove(id);
  }
}
