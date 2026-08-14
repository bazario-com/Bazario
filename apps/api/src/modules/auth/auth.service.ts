import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomUUID } from 'crypto';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ReferralsService } from '../referrals/referrals.service';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly referralsService: ReferralsService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      // Deliberately generic message: do not reveal whether the email
      // exists to an unauthenticated caller (avoids account enumeration).
      throw new ConflictException('Unable to register with the provided details');
    }

    // argon2id: OWASP's recommended password hashing algorithm — resistant
    // to both GPU cracking and side-channel attacks, unlike bcrypt/scrypt.
    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });

    const user = await this.usersService.create({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      passwordHash,
    });

    if (dto.referralCode) {
      // Best-effort: a bad/self referral code must never block signup.
      await this.referralsService.redeemCode(user.id, dto.referralCode).catch(() => null);
    }

    const tokens = await this.issueTokenPair(user.id, user.email, user.role);
    return { user: this.usersService.toSafeUser(user), ...tokens };
  }

  async login(dto: LoginDto, meta: { userAgent?: string; ipAddress?: string }) {
    const user = await this.usersService.findByEmail(dto.email);

    // Compare against a real hash even when no user was found, so response
    // timing doesn't leak whether the email is registered.
    const hashToCompare = user?.passwordHash ?? (await argon2.hash(randomUUID()));
    const passwordValid = await argon2.verify(hashToCompare, dto.password).catch(() => false);

    if (!user || !user.passwordHash || !passwordValid || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.usersService.touchLastLogin(user.id);
    const tokens = await this.issueTokenPair(user.id, user.email, user.role, meta);
    return { user: this.usersService.toSafeUser(user), ...tokens };
  }

  async refresh(rawRefreshToken: string) {
    const tokenHash = this.hashToken(rawRefreshToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expired, please log in again');
    }

    const user = await this.usersService.findById(stored.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Session expired, please log in again');
    }

    // Rotate: revoke the used token and issue a brand new pair. If a
    // revoked token is ever presented again, that's a strong signal of
    // token theft/replay — worth alerting on in a future fraud-detection pass.
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokenPair(user.id, user.email, user.role);
  }

  async logout(rawRefreshToken: string) {
    const tokenHash = this.hashToken(rawRefreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokenPair(
    userId: string,
    email: string,
    role: string,
    meta: { userAgent?: string; ipAddress?: string } = {},
  ): Promise<TokenPair> {
    const payload: JwtPayload = { sub: userId, email, role };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get('jwt.accessSecret'),
      expiresIn: this.config.get('jwt.accessExpiresIn'),
    });

    const refreshToken = randomUUID() + randomUUID(); // 72 chars of entropy
    const refreshExpiresInDays = 30;
    const expiresAt = new Date(Date.now() + refreshExpiresInDays * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: this.hashToken(refreshToken),
        userId,
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  // Refresh tokens are never stored raw — only their SHA-256 hash — so a
  // database read/leak alone can't be used to forge a session.
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
