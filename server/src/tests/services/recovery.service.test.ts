import { RecoveryService } from '../../services/recovery.service';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// Mock Prisma
jest.mock('@prisma/client');

describe('RecoveryService', () => {
  let recoveryService: RecoveryService;
  let mockPrisma: jest.Mocked<PrismaClient>;

  const mockUserId = 'test-user-id';
  const mockEmail = 'test@example.com';

  beforeEach(() => {
    jest.clearAllMocks();
    recoveryService = RecoveryService.getInstance();
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      recoveryKey: {
        create: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaClient>;

    (recoveryService as any).db = mockPrisma;
  });

  describe('generateRecoveryKey', () => {
    it('should generate recovery key successfully', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockUserId,
        email: mockEmail,
      });

      const result = await recoveryService.generateRecoveryKey();

      expect(result).toBeDefined();
      expect(result.key).toBeDefined();
      expect(mockPrisma.recoveryKey.create).toHaveBeenCalled();
    });

    it('should handle user not found error', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        recoveryService.generateRecoveryKey()
      ).rejects.toThrow('User not found');
    });

    it('should handle database errors', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockUserId,
        email: mockEmail,
      });

      const dbError = new Error('Database error');
      (mockPrisma.recoveryKey.create as jest.Mock).mockRejectedValue(dbError);

      await expect(
        recoveryService.generateRecoveryKey()
      ).rejects.toThrow('Failed to generate recovery key');
    });
  });

  describe('verifyRecoveryKey', () => {
    const mockRecoveryKey = 'test-recovery-key';

    it('should verify recovery key successfully', async () => {
      (mockPrisma.recoveryKey.findFirst as jest.Mock).mockResolvedValue({
        id: 'key-1',
        userId: mockUserId,
        hash: Buffer.from('test-hash'),
        salt: Buffer.from('test-salt'),
        used: false,
        expiresAt: new Date(Date.now() + 3600000),
      });

      const result = await recoveryService.verifyRecoveryKey(mockRecoveryKey);

      expect(result).toBe(true);
      expect(mockPrisma.recoveryKey.delete).toHaveBeenCalled();
    });

    it('should handle invalid recovery key', async () => {
      (mockPrisma.recoveryKey.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await recoveryService.verifyRecoveryKey(mockRecoveryKey);

      expect(result).toBe(false);
    });

    it('should handle expired recovery key', async () => {
      (mockPrisma.recoveryKey.findFirst as jest.Mock).mockResolvedValue({
        id: 'key-1',
        userId: mockUserId,
        hash: Buffer.from('test-hash'),
        salt: Buffer.from('test-salt'),
        used: false,
        expiresAt: new Date(Date.now() - 3600000),
      });

      const result = await recoveryService.verifyRecoveryKey(mockRecoveryKey);

      expect(result).toBe(false);
      expect(mockPrisma.recoveryKey.delete).toHaveBeenCalled();
    });

    it('should handle already used recovery key', async () => {
      (mockPrisma.recoveryKey.findFirst as jest.Mock).mockResolvedValue({
        id: 'key-1',
        userId: mockUserId,
        hash: Buffer.from('test-hash'),
        salt: Buffer.from('test-salt'),
        used: true,
        expiresAt: new Date(Date.now() + 3600000),
      });

      const result = await recoveryService.verifyRecoveryKey(mockRecoveryKey);

      expect(result).toBe(false);
      expect(mockPrisma.recoveryKey.delete).toHaveBeenCalled();
    });
  });

  describe('deleteRecoveryKeys', () => {
    it('should delete all recovery keys for user', async () => {
      await recoveryService.deleteRecoveryKeys(mockUserId);

      expect(mockPrisma.recoveryKey.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database error');
      (mockPrisma.recoveryKey.deleteMany as jest.Mock).mockRejectedValue(dbError);

      await expect(
        recoveryService.deleteRecoveryKeys(mockUserId)
      ).rejects.toThrow('Failed to delete recovery keys');
    });
  });
});
