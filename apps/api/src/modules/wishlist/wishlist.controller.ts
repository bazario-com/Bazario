import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { IsString } from 'class-validator';
import { WishlistService } from './wishlist.service';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

class AddWishlistItemDto {
  @IsString()
  productId: string;
}

@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.wishlistService.findAllForUser(user.id);
  }

  @Post()
  add(@CurrentUser() user: AuthenticatedUser, @Body() dto: AddWishlistItemDto) {
    return this.wishlistService.add(user.id, dto.productId);
  }

  @Delete(':productId')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('productId') productId: string) {
    return this.wishlistService.remove(user.id, productId);
  }
}
