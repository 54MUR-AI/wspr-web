import dotenv from 'dotenv';
import type { 
  AuthenticatorTransport,
  AuthenticatorAttachment,
  UserVerificationRequirement,
} from '@simplewebauthn/typescript-types';

dotenv.config();

// Environment variables with defaults
export const {
  NODE_ENV = 'development',
  JWT_SECRET = 'wspr-dev-secret-key-change-in-production',
  DATABASE_URL = 'postgresql://postgres:postgres@localhost:5433/wspr',
  RP_NAME = 'WSPR Web',
  RP_ID = 'localhost',
  ORIGIN = 'http://localhost:3000',
} = process.env;

// Port configuration
export const PORT = parseInt(process.env.PORT || '3001', 10);

// Rate limiting configuration
export const RATE_LIMIT = {
  WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
  MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // Maximum requests per window
};

// WebAuthn configuration
export const WEBAUTHN_CONFIG = {
  rpName: RP_NAME,
  rpID: RP_ID,
  expectedOrigin: ORIGIN,
  timeout: 60000, // 1 minute
  authenticatorSelection: {
    authenticatorAttachment: 'platform' as AuthenticatorAttachment,
    userVerification: 'preferred' as UserVerificationRequirement,
    requireResidentKey: false,
  },
  attestation: 'none' as const,
};
