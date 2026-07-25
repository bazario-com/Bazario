import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Partial<UsersService>>;
  let prisma: any;

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      touchLastLogin: jest.fn(),
      toSafeUser: jest.fn((u) => u),
    };

    prisma = {
      refreshToken: {
        create: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: { signAsync: jest.fn().mockResolvedValue('access.jwt.token') } },
        {
          provide: ConfigService,
          useValue: { get: jest.fn((key: string) => (key.includes('Secret') ? 'test-secret' : '15m')) },
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('register', () => {
    it('throws a generic ConflictException if the email is already registered', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue({ id: 'existing-user' });

      await expect(
        service.register({
          email: 'taken@example.com',
          firstName: 'A',
          lastName: 'B',
          password: 'Str0ng!Passw0rd123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('hashes the password with argon2id before storing the user', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
      (usersService.create as jest.Mock).mockImplementation(async (data) => ({
        id: 'new-user',
        role: 'CUSTOMER',
        ...data,
      }));

      await service.register({
        email: 'new@example.com',
        firstName: 'A',
        lastName: 'B',
        password: 'Str0ng!Passw0rd123',
      });

      const createArg = (usersService.create as jest.Mock).mock.calls[0][0];
      expect(createArg.passwordHash).not.toEqual('Str0ng!Passw0rd123');
      expect(await argon2.verify(createArg.passwordHash, 'Str0ng!Passw0rd123')).toBe(true);
    });
  });

  describe('login', () => {
    it('rejects an unknown email with a generic UnauthorizedException (no enumeration)', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@example.com', password: 'whatever123!ABC' }, {}),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects a correct email with the wrong password', async () => {
      const passwordHash = await argon2.hash('CorrectPassw0rd!123', { type: argon2.argon2id });
      (usersService.findByEmail as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        passwordHash,
        isActive: true,
        role: 'CUSTOMER',
      });

      await expect(
        service.login({ email: 'user@example.com', password: 'WrongPassword!123' }, {}),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects a deactivated account even with the correct password', async () => {
      const passwordHash = await argon2.hash('CorrectPassw0rd!123', { type: argon2.argon2id });
      (usersService.findByEmail as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        passwordHash,
        isActive: false,
        role: 'CUSTOMER',
      });

      await expect(
        service.login({ email: 'user@example.com', password: 'CorrectPassw0rd!123' }, {}),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('succeeds with correct credentials and returns tokens', async () => {
      const passwordHash = await argon2.hash('CorrectPassw0rd!123', { type: argon2.argon2id });
      (usersService.findByEmail as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        passwordHash,
        isActive: true,
        role: 'CUSTOMER',
      });

      const result = await service.login(
        { email: 'user@example.com', password: 'CorrectPassw0rd!123' },
        {},
      );

      expect(result.accessToken).toBe('access.jwt.token');
      expect(result.refreshToken).toBeDefined();
      expect(usersService.touchLastLogin).toHaveBeenCalledWith('user-1');
    });
  });

  describe('refresh', () => {
    it('rejects a revoked refresh token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        userId: 'user-1',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 10000),
      });

      await expect(service.refresh('some-raw-token')).rejects.toThrow(UnauthorizedException);
    });

    it('rejects an expired refresh token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        userId: 'user-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() - 10000),
      });

      await expect(service.refresh('some-raw-token')).rejects.toThrow(UnauthorizedException);
    });
  });
});
