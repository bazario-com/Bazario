import { Controller, Get, Param, Post } from '@nestjs/common';
import { RecentlyViewedService } from './recently-viewed.service';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Controller('recently-viewed')
export class RecentlyViewedController {
  constructor(private readonly recentlyViewedService: RecentlyViewedService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.recentlyViewedService.findAllForUser(user.id);
  }

  @Post(':productId')
  record(@CurrentUser() user: AuthenticatedUser, @Param('productId') productId: string) {
    return this.recentlyViewedService.record(user.id, productId);
  }
}
