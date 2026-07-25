import { Controller, Get, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async me(@CurrentUser() authUser: AuthenticatedUser) {
    const user = await this.usersService.findById(authUser.id);
    if (!user) throw new NotFoundException('User not found');
    return this.usersService.toSafeUser(user);
  }
}
