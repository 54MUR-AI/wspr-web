import { WebAuthnService } from '../../services/webauthn.service';
import { PrismaClient } from '@prisma/client';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  GenerateRegistrationOptionsOpts,
  VerifyRegistrationResponseOpts,
  GenerateAuthenticationOptionsOpts,
  VerifyAuthenticationResponseOpts,
} from '@simplewebauthn/server';

// Mock @simplewebauthn/server
jest.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: jest.fn(),
  verifyRegistrationResponse: jest.fn(),
  generateAuthenticationOptions: jest.fn(),
  verifyAuthenticationResponse: jest.fn(),
}));

// Mock Prisma
jest.mock('@prisma/client');

describe('WebAuthnService', () => {
  let webAuthnService: WebAuthnService;
  let mockPrisma: jest.Mocked<PrismaClient>;

  const mockUserId = 'test-user-id';
  const mockUserName = 'test@example.com';
  const mockDeviceName = 'Test Device';

  beforeEach(() => {
    jest.clearAllMocks();
    webAuthnService = WebAuthnService.getInstance();
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      authenticator: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findUnique: jest.fn(),
      },
      challenge: {
        create: jest.fn(),
        findFirst: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaClient>;

    (webAuthnService as any).db = mockPrisma;
  });

  describe('generateRegistrationOptions', () => {
    it('should generate registration options successfully', async () => {
      const result = await webAuthnService.generateRegistrationOptions(mockUserId, mockUserName, mockDeviceName);

      expect(result).toBeDefined();
      expect(result.challenge).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(mockUserId);
      expect(result.user.name).toBe(mockUserName);
    });

    it('should handle database errors when fetching authenticators', async () => {
      const dbError = new Error('Database connection failed');
      (mockPrisma.authenticator.findMany as jest.Mock).mockRejectedValue(dbError);

      await expect(
        webAuthnService.generateRegistrationOptions(mockUserId, mockUserName, mockDeviceName)
      ).rejects.toThrow('Failed to fetch existing authenticators');
    });

    it('should handle WebAuthn errors during options generation', async () => {
      (mockPrisma.authenticator.findMany as jest.Mock).mockResolvedValue([]);
      const webAuthnError = new Error('Invalid RP ID');
      (generateRegistrationOptions as jest.Mock).mockRejectedValue(webAuthnError);

      await expect(
        webAuthnService.generateRegistrationOptions(mockUserId, mockUserName, mockDeviceName)
      ).rejects.toThrow('Failed to generate WebAuthn options');
    });

    it('should handle database errors when storing challenge', async () => {
      (mockPrisma.authenticator.findMany as jest.Mock).mockResolvedValue([]);
      (generateRegistrationOptions as jest.Mock).mockResolvedValue({
        challenge: 'test-challenge',
      });
      const dbError = new Error('Challenge storage failed');
      (mockPrisma.challenge.create as jest.Mock).mockRejectedValue(dbError);

      await expect(
        webAuthnService.generateRegistrationOptions(mockUserId, mockUserName, mockDeviceName)
      ).rejects.toThrow('Failed to store challenge');
    });
  });

  describe('verifyRegistration', () => {
    const mockCredential = {
      id: 'credentialId123',
      type: 'public-key',
      rawId: Buffer.from('credentialId123'),
      response: {
        clientDataJSON: Buffer.from('{}'),
        attestationObject: Buffer.from('{}'),
      },
      clientExtensionResults: {},
      authenticatorAttachment: 'platform',
    };

    it('should verify registration successfully', async () => {
      (mockPrisma.challenge.findFirst as jest.Mock).mockResolvedValue({
        challenge: 'test-challenge',
      });

      (verifyRegistrationResponse as jest.Mock).mockResolvedValue({
        verified: true,
        registrationInfo: {
          credentialID: Buffer.from('credentialId123'),
          credentialPublicKey: Buffer.from('publicKey123'),
          counter: 0,
        },
      });

      const result = await webAuthnService.verifyRegistration(mockUserId, mockCredential);

      expect(result).toBeDefined();
      expect(result.verified).toBe(true);
    });

    it('should handle missing challenge error', async () => {
      (mockPrisma.challenge.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        webAuthnService.verifyRegistration(mockUserId, mockCredential)
      ).rejects.toThrow('Challenge not found');
    });

    it('should handle verification failure', async () => {
      (mockPrisma.challenge.findFirst as jest.Mock).mockResolvedValue({
        challenge: 'test-challenge',
      });

      (verifyRegistrationResponse as jest.Mock).mockResolvedValue({
        verified: false,
      });

      await expect(
        webAuthnService.verifyRegistration(mockUserId, mockCredential)
      ).rejects.toThrow('Invalid registration response');
    });
  });

  describe('verifyAuthentication', () => {
    const mockCredential = {
      id: 'credentialId123',
      type: 'public-key',
      rawId: Buffer.from('credentialId123'),
      response: {
        clientDataJSON: Buffer.from('{}'),
        authenticatorData: Buffer.from('{}'),
        signature: Buffer.from('{}'),
        userHandle: Buffer.from('{}'),
      },
      clientExtensionResults: {},
    };

    it('should verify authentication successfully', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockUserId,
        email: mockUserName,
      });

      (mockPrisma.challenge.findFirst as jest.Mock).mockResolvedValue({
        challenge: 'test-challenge',
      });

      (mockPrisma.authenticator.findUnique as jest.Mock).mockResolvedValue({
        credentialID: 'credentialId123',
        credentialPublicKey: Buffer.from('publicKey123'),
        counter: 0,
      });

      (verifyAuthenticationResponse as jest.Mock).mockResolvedValue({
        verified: true,
      });

      const result = await webAuthnService.verifyAuthentication(mockUserName, mockCredential);

      expect(result).toBeDefined();
      expect(result.verified).toBe(true);
    });

    it('should handle user not found error', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        webAuthnService.verifyAuthentication(mockUserName, mockCredential)
      ).rejects.toThrow('User not found');
    });

    it('should handle missing authenticator error', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockUserId,
        email: mockUserName,
      });

      (mockPrisma.challenge.findFirst as jest.Mock).mockResolvedValue({
        challenge: 'test-challenge',
      });

      (mockPrisma.authenticator.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        webAuthnService.verifyAuthentication(mockUserName, mockCredential)
      ).rejects.toThrow('Authenticator not found');
    });
  });

  describe('removeAuthenticator', () => {
    it('should remove authenticator successfully', async () => {
      (mockPrisma.authenticator.findUnique as jest.Mock).mockResolvedValue({
        id: 'auth-1',
        userId: mockUserId,
      });

      await webAuthnService.removeAuthenticator('auth-1', mockUserId);

      expect(mockPrisma.authenticator.delete).toHaveBeenCalledWith({
        where: { id: 'auth-1' },
      });
    });

    it('should handle authenticator not found error', async () => {
      (mockPrisma.authenticator.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        webAuthnService.removeAuthenticator('non-existent', mockUserId)
      ).rejects.toThrow('Authenticator not found');
    });

    it('should handle unauthorized removal attempt', async () => {
      (mockPrisma.authenticator.findUnique as jest.Mock).mockResolvedValue({
        id: 'auth-1',
        userId: 'different-user',
      });

      await expect(
        webAuthnService.removeAuthenticator('auth-1', mockUserId)
      ).rejects.toThrow('Authenticator not found');
    });
  });
});
