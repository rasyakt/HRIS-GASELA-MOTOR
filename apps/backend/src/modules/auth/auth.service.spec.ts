import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { WinstonLoggerService } from '../../common/logger/logger.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-secret'),
  compare: jest.fn().mockResolvedValue(true),
}));

const bcryptMock = bcrypt as unknown as {
  hash: jest.Mock;
  compare: jest.Mock;
};

const mockUser = {
  id: 1,
  employeeId: 10,
  username: 'admin',
  passwordHash: 'hashed-secret',
  role: 'admin',
  refreshTokenHash: null,
  twoFactorEnabled: false,
  twoFactorSecret: null,
  twoFactorRecoveryCodes: null,
  isActive: true,
  employee: { fullName: 'Admin Gasela', departmentId: 1, isActive: true },
};

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwt: any;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const jwtMock = {
    sign: jest.fn((p) => `signed.${JSON.stringify(p)}.x`),
    verifyAsync: jest.fn(),
  };

  const configMock = {
    getOrThrow: jest.fn((key: string) => {
      if (key === 'app.jwtSecret')
        return 'access-secret-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
      if (key === 'app.jwtRefreshSecret')
        return 'refresh-secret-xxxxxxxxxxxxxxxxxxxxxxxx';
      return '15m';
    }),
  };

  const loggerMock = {
    failedLogin: jest.fn(),
    successfulLogin: jest.fn(),
    accountLocked: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
        { provide: ConfigService, useValue: configMock },
        { provide: WinstonLoggerService, useValue: loggerMock },
      ],
    }).compile();
    service = module.get(AuthService);
    prisma = prismaMock;
    jwt = jwtMock;
  });

  describe('login', () => {
    it('mengembalikan token & profil user saat 2FA tidak aktif', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({ id: 1 });
      const result = await service.login({
        username: 'admin',
        password: 'Admin123!',
      });

      expect(result.requires2FA).toBeFalsy();
      expect(result.accessToken).toContain('signed.');
      expect(result.refreshToken).toContain('signed.');
      expect(result.user?.username).toBe('admin');
      expect(result.user?.role).toBe('admin');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ refreshTokenHash: 'hashed-secret' }),
        }),
      );
    });

    it('mengembalikan requires2FA: true & tempToken jika user mengaktifkan 2FA', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        twoFactorEnabled: true,
        twoFactorSecret: 'enc-secret',
      });
      const result = await service.login({
        username: 'admin',
        password: 'Admin123!',
      });

      expect(result.requires2FA).toBe(true);
      expect(result.tempToken).toBeDefined();
      expect(result.user?.username).toBe('admin');
      expect(result.accessToken).toBeUndefined();
    });

    it('menolak saat user tidak ditemukan', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.login({ username: 'x', password: 'Admin123!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('menolak saat password salah', async () => {
      bcryptMock.compare.mockResolvedValueOnce(false);
      prisma.user.findUnique.mockResolvedValue(mockUser);
      await expect(
        service.login({ username: 'admin', password: 'Salah123!' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('membuat pasangan token baru bila refresh valid', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        refreshTokenHash: 'hashed-secret',
      });
      prisma.user.update.mockResolvedValue({ id: 1 });
      jwt.verifyAsync.mockResolvedValue({ sub: 1, username: 'admin' });

      const result = await service.refresh({ refreshToken: 'valid.token' });
      expect(result.accessToken).toContain('signed.');
      expect(result.user?.username).toBe('admin');
    });

    it('menolak saat token tidak dapat diverifikasi', async () => {
      jwt.verifyAsync.mockRejectedValue(new Error('bad jws'));
      await expect(
        service.refresh({ refreshToken: 'invalid' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('menolak dan mencabut sesi saat refresh tidak cocok hash', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        refreshTokenHash: 'hashed-secret',
      });
      bcryptMock.compare.mockResolvedValueOnce(false);
      jwt.verifyAsync.mockResolvedValue({ sub: 1, username: 'admin' });

      await expect(
        service.refresh({ refreshToken: 'stale.rotated' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ refreshTokenHash: null }),
        }),
      );
    });
  });

  describe('logout & me', () => {
    it('mencabut refresh hash saat logout', async () => {
      prisma.user.update.mockResolvedValue({ id: 1 });
      await service.logout(1);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ refreshTokenHash: null }),
        }),
      );
    });

    it('mengembalikan profil user aktif', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      const me = await service.getMe(1);
      expect(me.fullName).toBe('Admin Gasela');
    });
  });

  describe('2FA management', () => {
    it('mengembalikan status 2FA aktif/nonaktif', async () => {
      prisma.user.findUnique.mockResolvedValue({
        twoFactorEnabled: true,
        twoFactorRecoveryCodes: JSON.stringify(['hash1', 'hash2']),
      });
      const status = await service.get2FaStatus(1);
      expect(status.enabled).toBe(true);
      expect(status.hasRecoveryCodes).toBe(true);
    });

    it('menonaktifkan 2FA dengan password yang valid', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        passwordHash: 'hashed-secret',
      });
      prisma.user.update.mockResolvedValue({ id: 1 });
      bcryptMock.compare.mockResolvedValueOnce(true);

      const res = await service.disable2Fa(1, { password: 'Admin123!' });
      expect(res.message).toContain('berhasil dinonaktifkan');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorRecoveryCodes: null,
        },
      });
    });
  });
});
