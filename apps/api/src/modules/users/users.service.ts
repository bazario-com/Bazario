import { Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(data: {
    email: string;
    firstName: string;
    lastName: string;
    passwordHash: string;
    role?: Role;
  }) {
    return this.prisma.user.create({ data });
  }

  // Cart is created lazily on first item add (see CartService), so no cart
  // row is created here — keeps registration fast and avoids empty carts
  // piling up for users who never shop.

  touchLastLogin(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  toSafeUser<T extends { passwordHash?: string | null; twoFactorSecret?: string | null }>(
    user: T,
  ): Omit<T, 'passwordHash' | 'twoFactorSecret'> {
    const { passwordHash, twoFactorSecret, ...safe } = user as any;
    return safe;
  }
}
