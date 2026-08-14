import { Controller, Get } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.referralsService.getMe(user.id);
  }
}
