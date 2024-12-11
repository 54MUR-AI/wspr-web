import { WebAuthnService } from '../../services/webauthn.service';
import { RecoveryService } from '../../services/recovery.service';
import { PrismaClient } from '@prisma/client';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import bcrypt from 'bcryptjs';

// Mock external dependencies
jest.mock('@simplewebauthn/server');
jest.mock('bcryptjs');
jest.mock('@prisma/client');

describe('Authentication Integration Tests', () => {
  let webAuthnService: WebAuthnService;
  let recoveryService: RecoveryService;
  let mockPrisma: jest.Mocked<PrismaClient>;

  const mockUserId = 'user123';
  const mockUserEmail = 'test@example.com';
  const mockDeviceName = 'Test Device';
  const mockChallenge = 'challenge123';

  beforeEach(() => {
    jest.clearAllMocks();

    // Initialize services
    webAuthnService = WebAuthnService.getInstance();
    recoveryService = RecoveryService.getInstance();

    // Setup mock Prisma client
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      authenticator: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
      },
      recoveryKey: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaClient>;

    // Inject mock Prisma client
    (webAuthnService as any).prisma = mockPrisma;
    (recoveryService as any).prisma = mockPrisma;
  });

  describe('WebAuthn Registration with Recovery Key', () => {
    const mockCredential = {
      id: 'credentialId123',
      type: 'public-key',
      rawId: 'rawId123',
      response: {
        clientDataJSON: 'clientData123',
        attestationObject: 'attestation123',
      },
    };

    beforeEach(() => {
      // Mock user lookup
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockUserId,
        email: mockUserEmail,
      });

      // Mock WebAuthn registration
      (generateRegistrationOptions as jest.Mock).mockResolvedValue({
        challenge: mockChallenge,
        rp: { name: 'WSPR Web', id: 'localhost' },
        user: { id: mockUserId, name: mockUserEmail },
        pubKeyCredParams: [],
        timeout: 60000,
        attestation: 'direct',
        excludeCredentials: [],
      });

      (verifyRegistrationResponse as jest.Mock).mockResolvedValue({
        verified: true,
        registrationInfo: {
          credentialID: Buffer.from('credentialId123'),
          credentialPublicKey: Buffer.from('publicKey123'),
          counter: 0,
        },
      });

      // Mock recovery key generation
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedKey123');
    });

    it('should register WebAuthn credential and generate recovery key', async () => {
      // Step 1: Generate registration options
      const registrationOptions = await webAuthnService.generateRegistrationOptions(
        mockUserId,
        mockDeviceName
      );

      expect(registrationOptions).toBeDefined();
      expect(registrationOptions.challenge).toBe(mockChallenge);

      // Step 2: Verify registration and create credential
      const registrationResult = await webAuthnService.verifyRegistrationResponse(
        mockUserId,
        mockCredential,
        mockDeviceName,
        mockChallenge
      );

      expect(registrationResult).toBe(true);
      expect(mockPrisma.authenticator.create).toHaveBeenCalled();

      // Step 3: Generate recovery key
      const recoveryKey = await recoveryService.generateRecoveryKey(mockUserId);

      expect(recoveryKey).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
      expect(mockPrisma.recoveryKey.create).toHaveBeenCalled();
    });

    it('should fail registration with invalid user', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        webAuthnService.generateRegistrationOptions(mockUserId, mockDeviceName)
      ).rejects.toThrow('User not found');

      await expect(
        recoveryService.generateRecoveryKey(mockUserId)
      ).rejects.toThrow('User not found');
    });
  });

  describe('Authentication Flow with Fallback to Recovery Key', () => {
    const mockAuthCredential = {
      id: 'credentialId123',
      type: 'public-key',
      rawId: 'rawId123',
      response: {
        clientDataJSON: 'clientData123',
        authenticatorData: 'authData123',
        signature: 'signature123',
        userHandle: 'userHandle123',
      },
    };

    const mockRecoveryKey = 'ABCD-EFGH-IJKL-MNOP';

    beforeEach(() => {
      // Mock user lookup
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockUserId,
        email: mockUserEmail,
      });

      // Mock WebAuthn authentication
      (generateAuthenticationOptions as jest.Mock).mockResolvedValue({
        challenge: mockChallenge,
        timeout: 60000,
        allowCredentials: [],
        userVerification: 'preferred',
      });

      (verifyAuthenticationResponse as jest.Mock).mockResolvedValue({
        verified: true,
        authenticationInfo: {
          newCounter: 1,
        },
      });

      // Mock recovery key verification
      (mockPrisma.recoveryKey.findFirst as jest.Mock).mockResolvedValue({
        id: 'key123',
        userId: mockUserId,
        hashedKey: 'hashedKey123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        used: false,
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    });

    it('should authenticate with WebAuthn successfully', async () => {
      // Step 1: Generate authentication options
      const authOptions = await webAuthnService.generateAuthenticationOptions(mockUserId);

      expect(authOptions).toBeDefined();
      expect(authOptions.challenge).toBe(mockChallenge);

      // Step 2: Verify authentication
      const authResult = await webAuthnService.verifyAuthenticationResponse(
        mockAuthCredential,
        mockChallenge
      );

      expect(authResult).toBe(true);
      expect(mockPrisma.authenticator.update).toHaveBeenCalled();
    });

    it('should fallback to recovery key when WebAuthn fails', async () => {
      // Mock WebAuthn failure
      (verifyAuthenticationResponse as jest.Mock).mockResolvedValue({
        verified: false,
      });

      // Step 1: Try WebAuthn authentication
      const authResult = await webAuthnService.verifyAuthenticationResponse(
        mockAuthCredential,
        mockChallenge
      );

      expect(authResult).toBe(false);

      // Step 2: Fallback to recovery key
      const recoveryResult = await recoveryService.verifyRecoveryKey(
        mockUserId,
        mockRecoveryKey
      );

      expect(recoveryResult).toBe(true);
      expect(mockPrisma.recoveryKey.update).toHaveBeenCalledWith({
        where: { id: 'key123' },
        data: { used: true },
      });
    });

    it('should handle both WebAuthn and recovery key failure', async () => {
      // Mock both authentication methods failing
      (verifyAuthenticationResponse as jest.Mock).mockResolvedValue({
        verified: false,
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Step 1: Try WebAuthn authentication
      const authResult = await webAuthnService.verifyAuthenticationResponse(
        mockAuthCredential,
        mockChallenge
      );

      expect(authResult).toBe(false);

      // Step 2: Try recovery key
      const recoveryResult = await recoveryService.verifyRecoveryKey(
        mockUserId,
        mockRecoveryKey
      );

      expect(recoveryResult).toBe(false);
    });
  });

  describe('Recovery Key Management', () => {
    beforeEach(() => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockUserId,
        email: mockUserEmail,
      });

      (mockPrisma.recoveryKey.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'key1',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          used: false,
        },
        {
          id: 'key2',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          used: true,
        },
      ]);
    });

    it('should list all recovery keys for a user', async () => {
      const keys = await recoveryService.listRecoveryKeys(mockUserId);

      expect(keys).toHaveLength(2);
      expect(mockPrisma.recoveryKey.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        select: {
          id: true,
          createdAt: true,
          expiresAt: true,
          used: true,
        },
      });
    });

    it('should delete all recovery keys for a user', async () => {
      await recoveryService.deleteAllRecoveryKeys(mockUserId);

      expect(mockPrisma.recoveryKey.delete).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
    });

    it('should generate new recovery key after using existing one', async () => {
      // Step 1: Use existing recovery key
      const mockRecoveryKey = 'ABCD-EFGH-IJKL-MNOP';
      const verifyResult = await recoveryService.verifyRecoveryKey(
        mockUserId,
        mockRecoveryKey
      );

      expect(verifyResult).toBe(true);
      expect(mockPrisma.recoveryKey.update).toHaveBeenCalledWith({
        where: { id: 'key1' },
        data: { used: true },
      });

      // Step 2: Generate new recovery key
      const newRecoveryKey = await recoveryService.generateRecoveryKey(mockUserId);

      expect(newRecoveryKey).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
      expect(mockPrisma.recoveryKey.create).toHaveBeenCalled();
    });
  });
});
