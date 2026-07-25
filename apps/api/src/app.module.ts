import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { CartModule } from './modules/cart/cart.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { RecentlyViewedModule } from './modules/recently-viewed/recently-viewed.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { OrdersModule } from './modules/orders/orders.module';
import { AdminModule } from './modules/admin/admin.module';
import appConfig from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    // Global rate limiting: a sane default baseline. Auth endpoints apply a
    // stricter limit on top of this via a route-level @Throttle override.
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    VendorsModule,
    CategoriesModule,
    ProductsModule,
    CartModule,
    AddressesModule,
    WishlistModule,
    RecentlyViewedModule,
    ReviewsModule,
    CouponsModule,
    OrdersModule,
    AdminModule,
  ],
  providers: [
    // Without this, @Throttle() on individual routes (e.g. auth login/register)
    // sets metadata that nothing reads — ThrottlerGuard is what actually
    // enforces it, globally, with per-route overrides layered on top.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
