// Set up environment variables for testing
process.env.NODE_ENV = 'test';
process.env.RP_NAME = 'WSPR Web';
process.env.RP_ID = 'localhost';
process.env.ORIGIN = 'http://localhost:3000';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.RATE_LIMIT_WINDOW = '900000'; // 15 minutes
process.env.RATE_LIMIT_MAX = '100';

import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { db } from '../database';

jest.mock('../database', () => ({
  __esModule: true,
  db: mockDeep<PrismaClient>(),
}));

beforeEach(() => {
  mockReset(prismaMock);
});

export const prismaMock = db as unknown as DeepMockProxy<PrismaClient>;

// Mock crypto functions
const mockRandomValues = jest.fn((buffer: Uint8Array) => {
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] = Math.floor(Math.random() * 256);
  }
  return buffer;
});

const mockSubtle = {
  digest: jest.fn(async (algorithm: string, data: ArrayBuffer) => {
    // Simple mock implementation for SHA-256
    const view = new DataView(data);
    const result = new ArrayBuffer(32); // SHA-256 is 32 bytes
    const resultView = new DataView(result);
    for (let i = 0; i < 32; i++) {
      resultView.setUint8(i, view.getUint8(i % data.byteLength));
    }
    return result;
  }),
};

Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: mockRandomValues,
    subtle: mockSubtle,
  },
});

// Mock WebAuthn navigator
Object.defineProperty(global, 'navigator', {
  value: {
    credentials: {
      create: jest.fn(),
      get: jest.fn(),
    },
  },
});

// Custom matchers
expect.extend({
  toBeValidChallenge(received: string) {
    const isValid = typeof received === 'string' && received.length >= 16;
    return {
      message: () =>
        `expected ${received} to be a valid challenge (string with length >= 16)`,
      pass: isValid,
    };
  },

  toBeValidCredentialId(received: string | Buffer) {
    const isValid =
      (typeof received === 'string' || Buffer.isBuffer(received)) &&
      (typeof received === 'string' ? received.length > 0 : received.length > 0);
    return {
      message: () =>
        `expected ${received} to be a valid credential ID (non-empty string or Buffer)`,
      pass: isValid,
    };
  },

  toBeValidPublicKey(received: Buffer) {
    const isValid = Buffer.isBuffer(received) && received.length > 0;
    return {
      message: () =>
        `expected ${received} to be a valid public key (non-empty Buffer)`,
      pass: isValid,
    };
  },

  toBeValidCounter(received: number) {
    const isValid = typeof received === 'number' && received >= 0;
    return {
      message: () =>
        `expected ${received} to be a valid counter (number >= 0)`,
      pass: isValid,
    };
  },

  toBeValidDeviceName(received: string) {
    const isValid = typeof received === 'string' && received.length > 0;
    return {
      message: () =>
        `expected ${received} to be a valid device name (non-empty string)`,
      pass: isValid,
    };
  },

  toBeValidUserId(received: string) {
    const isValid = typeof received === 'string' && received.length > 0;
    return {
      message: () =>
        `expected ${received} to be a valid user ID (non-empty string)`,
      pass: isValid,
    };
  },

  toBeValidTimestamp(received: Date) {
    const isValid = received instanceof Date && !isNaN(received.getTime());
    return {
      message: () =>
        `expected ${received} to be a valid timestamp (valid Date object)`,
      pass: isValid,
    };
  },

  toBeValidAuthenticatorData(received: any) {
    const requiredFields = ['id', 'deviceName', 'createdAt', 'lastUsed'];
    const hasAllFields = requiredFields.every(field => field in received);
    const isValid = hasAllFields &&
      typeof received.id === 'string' &&
      typeof received.deviceName === 'string' &&
      received.createdAt instanceof Date &&
      received.lastUsed instanceof Date;
    
    return {
      message: () =>
        `expected ${JSON.stringify(received)} to be a valid authenticator data object`,
      pass: isValid,
    };
  },

  toBeValidJWT(received: string) {
    const parts = received.split('.');
    const pass = parts.length === 3;
    return {
      pass,
      message: () =>
        pass
          ? 'Expected token not to be a valid JWT'
          : 'Expected token to be a valid JWT',
    };
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidChallenge(): R;
      toBeValidCredentialId(): R;
      toBeValidPublicKey(): R;
      toBeValidCounter(): R;
      toBeValidDeviceName(): R;
      toBeValidUserId(): R;
      toBeValidTimestamp(): R;
      toBeValidAuthenticatorData(): R;
      toBeValidJWT(): R;
    }
  }
}

// Test helpers
export const createTestUser = async () => {
  const user = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: null,
    disabled: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  prismaMock.user.create.mockResolvedValue(user);
  return user;
};

export const createTestAuthenticator = async (userId: string) => {
  const authenticator = {
    id: 'test-authenticator-id',
    userId,
    credentialID: 'test-credential-id',
    credentialPublicKey: 'test-public-key',
    counter: 0,
    deviceType: 'platform',
    backedUp: false,
    transports: [],
    deviceName: 'Test Device',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  prismaMock.authenticator.create.mockResolvedValue(authenticator);
  return authenticator;
};

export const createTestRecoveryKey = async (userId: string) => {
  const recoveryKey = {
    id: 'test-recovery-key-id',
    userId,
    hash: Buffer.from('test-hash'),
    salt: Buffer.from('test-salt'),
    used: false,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  prismaMock.recoveryKey.create.mockResolvedValue(recoveryKey);
  return recoveryKey;
};

// Mock WebAuthn attestation
export const mockAttestationResponse = {
  id: 'test-credential-id',
  rawId: 'test-credential-id',
  response: {
    attestationObject: 'test-attestation-object',
    clientDataJSON: JSON.stringify({
      type: 'webauthn.create',
      challenge: 'test-challenge',
      origin: 'http://localhost:3000',
    }),
  },
  type: 'public-key',
};

// Mock WebAuthn assertion
export const mockAssertionResponse = {
  id: 'test-credential-id',
  rawId: 'test-credential-id',
  response: {
    authenticatorData: 'test-authenticator-data',
    clientDataJSON: JSON.stringify({
      type: 'webauthn.get',
      challenge: 'test-challenge',
      origin: 'http://localhost:3000',
    }),
    signature: 'test-signature',
    userHandle: 'test-user-handle',
  },
  type: 'public-key',
};

// Clean up function to run after each test
afterEach(() => {
  jest.clearAllMocks();
});
