import { Controller, Get } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.rewardsService.getMe(user.id);
  }
}
