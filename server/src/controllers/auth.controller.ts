import { Request, Response } from 'express';
import { db } from '../database';
import { AppError } from '../utils/app-error';
import { generateToken } from '../utils/jwt';
import {
  generateRegistrationOptions,
  generateAuthenticationOptions,
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransport,
  AuthenticatorTransportFuture,
} from '@simplewebauthn/typescript-types';
import { WEBAUTHN_CONFIG } from '../config';
import { z } from 'zod';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
});

const verifySchema = z.object({
  email: z.string().email(),
  response: z.any(),
});

// Controller functions
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const user = await db.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        disabled: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    res.json(user);
  } catch (error) {
    throw error;
  }
};

export const registerWebAuthn = async (req: Request, res: Response) => {
  try {
    const { email, name } = registerSchema.parse(req.body);

    // Check if user exists
    let user = await db.user.findUnique({ where: { email } });
    
    if (user && user.currentChallenge) {
      throw new AppError(400, 'Registration already in progress');
    }

    if (!user) {
      user = await db.user.create({
        data: { email, name },
      });
    }

    const options = await generateRegistrationOptions({
      rpName: WEBAUTHN_CONFIG.rpName,
      rpID: WEBAUTHN_CONFIG.rpID,
      userID: user.id,
      userName: user.email,
      attestationType: WEBAUTHN_CONFIG.attestation,
      authenticatorSelection: WEBAUTHN_CONFIG.authenticatorSelection,
      timeout: WEBAUTHN_CONFIG.timeout,
    });

    // Save challenge
    await db.user.update({
      where: { id: user.id },
      data: { currentChallenge: options.challenge },
    });

    res.json(options);
  } catch (error) {
    throw error;
  }
};

export const verifyWebAuthnRegistration = async (req: Request, res: Response) => {
  try {
    const { email, response } = verifySchema.parse(req.body);
    const registrationResponse = response as RegistrationResponseJSON;

    // Get user
    const user = await db.user.findUnique({
      where: { email },
      include: { authenticators: true },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (!user.currentChallenge) {
      throw new AppError(400, 'No registration in progress');
    }

    const verificationResponse = await verifyRegistrationResponse({
      response,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: WEBAUTHN_CONFIG.expectedOrigin,
      expectedRPID: WEBAUTHN_CONFIG.rpID,
    });

    const { verified, registrationInfo } = verificationResponse;

    if (!verified || !registrationInfo) {
      throw new AppError(400, 'Invalid registration response');
    }

    const { credentialPublicKey, credentialID, counter } = registrationInfo;

    // Save the authenticator
    await db.authenticator.create({
      data: {
        credentialId: Buffer.from(credentialID),
        credentialPublicKey: Buffer.from(credentialPublicKey),
        counter,
        transports: registrationResponse.response.transports as AuthenticatorTransport[],
        userId: user.id,
      },
    });

    // Clear challenge and mark user as registered
    await db.user.update({
      where: { id: user.id },
      data: {
        currentChallenge: null,
        registered: true,
      },
    });

    // Generate token
    const token = generateToken({ id: user.id, email: user.email });

    res.json({ token });
  } catch (error) {
    throw error;
  }
};

export const getWebAuthnLoginOptions = async (req: Request, res: Response) => {
  try {
    const { email } = loginSchema.parse(req.body);

    const user = await db.user.findUnique({
      where: { email },
      include: { authenticators: true },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (!user.registered) {
      throw new AppError(400, 'User not registered');
    }

    const options = await generateAuthenticationOptions({
      rpID: WEBAUTHN_CONFIG.rpID,
      allowCredentials: user.authenticators.map((authenticator) => ({
        id: authenticator.credentialId,
        type: 'public-key' as const,
        transports: authenticator.transports as AuthenticatorTransportFuture[],
      })),
      userVerification: WEBAUTHN_CONFIG.authenticatorSelection.userVerification,
      timeout: WEBAUTHN_CONFIG.timeout,
    });

    // Save challenge
    await db.user.update({
      where: { id: user.id },
      data: { currentChallenge: options.challenge },
    });

    res.json(options);
  } catch (error) {
    throw error;
  }
};

export const verifyWebAuthnLogin = async (req: Request, res: Response) => {
  try {
    const { email, response } = verifySchema.parse(req.body);
    const authenticationResponse = response as AuthenticationResponseJSON;

    const user = await db.user.findUnique({
      where: { email },
      include: { authenticators: true },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (!user.currentChallenge) {
      throw new AppError(400, 'No authentication in progress');
    }

    const authenticator = user.authenticators.find(
      (a) => Buffer.compare(a.credentialId, Buffer.from(authenticationResponse.rawId, 'base64url')) === 0
    );

    if (!authenticator) {
      throw new AppError(400, 'Authenticator not found');
    }

    const verificationResponse = await verifyAuthenticationResponse({
      response,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: WEBAUTHN_CONFIG.expectedOrigin,
      expectedRPID: WEBAUTHN_CONFIG.rpID,
      authenticator: {
        credentialPublicKey: authenticator.credentialPublicKey,
        credentialID: authenticator.credentialId,
        counter: authenticator.counter,
      },
    });

    const { verified } = verificationResponse;

    if (!verified) {
      throw new AppError(400, 'Invalid authentication response');
    }

    // Update authenticator counter
    await db.authenticator.update({
      where: { id: authenticator.id },
      data: { counter: verificationResponse.authenticationInfo.newCounter },
    });

    // Clear challenge
    await db.user.update({
      where: { id: user.id },
      data: { currentChallenge: null },
    });

    // Generate token
    const token = generateToken({ id: user.id, email: user.email });

    res.json({ token });
  } catch (error) {
    throw error;
  }
};
