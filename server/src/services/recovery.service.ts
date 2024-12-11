import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '../database';
import { AppError } from '../utils/app-error';

export class RecoveryService {
  private static instance: RecoveryService;

  private constructor() {}

  public static getInstance(): RecoveryService {
    if (!RecoveryService.instance) {
      RecoveryService.instance = new RecoveryService();
    }
    return RecoveryService.instance;
  }

  private async generateRecoveryKey(): Promise<string> {
    try {
      // Generate a random 32-byte key and encode it as base64
      const key = randomBytes(32);
      return key.toString('base64');
    } catch (error) {
      console.error('Error generating recovery key:', error);
      throw new AppError(500, 'Failed to generate recovery key');
    }
  }

  private async hashRecoveryKey(key: string): Promise<{ hash: Buffer; salt: Buffer }> {
    try {
      const salt = randomBytes(16);
      const saltStr = salt.toString('base64');
      const hash = await bcrypt.hash(key, saltStr);
      return {
        hash: Buffer.from(hash, 'utf8'),
        salt
      };
    } catch (error) {
      console.error('Error hashing recovery key:', error);
      throw new AppError(500, 'Failed to hash recovery key');
    }
  }

  public async createRecoveryKey(userId: string): Promise<string> {
    try {
      // Generate a new recovery key
      const recoveryKey = await this.generateRecoveryKey();
      const { hash, salt } = await this.hashRecoveryKey(recoveryKey);

      // Store the hashed key in the database
      await db.recoveryKey.create({
        data: {
          hash,
          salt,
          userId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // Return the unhashed key to the user
      return recoveryKey;
    } catch (error) {
      console.error('Error creating recovery key:', error);
      throw new AppError(500, 'Failed to create recovery key');
    }
  }

  public async verifyRecoveryKey(userId: string, recoveryKey: string): Promise<boolean> {
    try {
      // Get the most recent unexpired recovery key
      const storedKey = await db.recoveryKey.findFirst({
        where: {
          userId,
          expiresAt: { gt: new Date() },
          used: false,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!storedKey) {
        throw new AppError(404, 'No valid recovery key found');
      }

      const saltStr = storedKey.salt.toString('base64');
      const hashedKey = await bcrypt.hash(recoveryKey, saltStr);
      const hashedBuffer = Buffer.from(hashedKey, 'utf8');
      const isValid = hashedBuffer.equals(storedKey.hash);
      
      if (!isValid) {
        throw new AppError(401, 'Invalid recovery key');
      }

      // Mark the key as used
      await db.recoveryKey.update({
        where: { id: storedKey.id },
        data: { used: true },
      });

      return true;
    } catch (error) {
      console.error('Error verifying recovery key:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to verify recovery key');
    }
  }

  public async listRecoveryKeys(userId: string) {
    try {
      return await db.recoveryKey.findMany({
        where: { userId },
        select: {
          id: true,
          createdAt: true,
          expiresAt: true,
          used: true,
        },
      });
    } catch (error) {
      console.error('Error listing recovery keys:', error);
      throw new AppError(500, 'Failed to list recovery keys');
    }
  }

  public async removeRecoveryKey(keyId: string, userId: string) {
    try {
      const key = await db.recoveryKey.findUnique({
        where: { id: keyId },
      });

      if (!key || key.userId !== userId) {
        throw new AppError(404, 'Recovery key not found');
      }

      await db.recoveryKey.delete({ where: { id: keyId } });
    } catch (error) {
      console.error('Error removing recovery key:', error);
      throw new AppError(500, 'Failed to remove recovery key');
    }
  }

  public async removeExpiredKeys() {
    try {
      await db.recoveryKey.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { used: true },
          ],
        },
      });
    } catch (error) {
      console.error('Error removing expired keys:', error);
      throw new AppError(500, 'Failed to remove expired keys');
    }
  }
}
