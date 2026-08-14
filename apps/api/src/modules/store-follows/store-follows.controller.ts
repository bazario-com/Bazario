import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { StoreFollowsService } from './store-follows.service';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Controller('store-follows')
export class StoreFollowsController {
  constructor(private readonly storeFollowsService: StoreFollowsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.storeFollowsService.findAllForUser(user.id);
  }

  @Post(':storeId')
  follow(@CurrentUser() user: AuthenticatedUser, @Param('storeId') storeId: string) {
    return this.storeFollowsService.follow(user.id, storeId);
  }

  @Delete(':storeId')
  unfollow(@CurrentUser() user: AuthenticatedUser, @Param('storeId') storeId: string) {
    return this.storeFollowsService.unfollow(user.id, storeId);
  }
}
