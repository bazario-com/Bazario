import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { UpsertAddressDto } from './dto/upsert-address.dto';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.addressesService.findAllForUser(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpsertAddressDto) {
    return this.addressesService.create(user.id, dto);
  }

  @Put(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpsertAddressDto,
  ) {
    return this.addressesService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.addressesService.remove(user.id, id);
  }
}
