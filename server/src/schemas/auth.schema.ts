import { z } from 'zod';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/typescript-types';

// User schemas
export const registerUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
});

export const loginUserSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// WebAuthn schemas
export const webAuthnRegistrationSchema = z.object({
  email: z.string().email('Invalid email address'),
  response: z.custom<RegistrationResponseJSON>(
    (data) => {
      try {
        return typeof data === 'object' &&
          data !== null &&
          'id' in data &&
          'rawId' in data &&
          'response' in data &&
          'type' in data;
      } catch {
        return false;
      }
    },
    'Invalid registration response'
  ),
});

export const webAuthnAuthenticationSchema = z.object({
  email: z.string().email('Invalid email address'),
  response: z.custom<AuthenticationResponseJSON>(
    (data) => {
      try {
        return typeof data === 'object' &&
          data !== null &&
          'id' in data &&
          'rawId' in data &&
          'response' in data &&
          'type' in data;
      } catch {
        return false;
      }
    },
    'Invalid authentication response'
  ),
});

// Recovery schemas
export const recoverySchema = z.object({
  email: z.string().email('Invalid email address'),
  recoveryKey: z.string().min(20, 'Invalid recovery key'),
});

// Device schemas
export const authenticatorSchema = z.object({
  id: z.string().uuid('Invalid authenticator ID'),
  name: z.string().min(1, 'Device name is required'),
});

// Response types
export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type WebAuthnRegistrationInput = z.infer<typeof webAuthnRegistrationSchema>;
export type WebAuthnAuthenticationInput = z.infer<typeof webAuthnAuthenticationSchema>;
export type RecoveryInput = z.infer<typeof recoverySchema>;
export type AuthenticatorInput = z.infer<typeof authenticatorSchema>;
