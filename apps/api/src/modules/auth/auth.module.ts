import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { ReferralsModule } from '../referrals/referrals.module';
import { RbacModule } from '../admin/rbac/rbac.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@Module({
  imports: [PassportModule, JwtModule.register({}), UsersModule, ReferralsModule, RbacModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    // Registered globally here (not in AppModule) because auth "owns" the
    // authentication concern; every request is JWT-checked unless @Public().
    // Order matters: JwtAuthGuard establishes req.user first, RolesGuard
    // enforces the existing coarse role check unchanged, then
    // PermissionsGuard adds the new granular check on top for routes that
    // opt in via @RequirePermission().
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
  exports: [AuthService],
})
export class AuthModule {}
