import {
  generateRegistrationOptions,
  generateAuthenticationOptions,
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { db } from '../database';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { AppError } from '../utils/app-error';
import type {
  VerifiedRegistrationResponse,
  VerifiedAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  AuthenticatorTransport,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/typescript-types';

// WebAuthn configuration
const rpName = 'WSPR Web';
const rpID = process.env.RP_ID || 'localhost';
const expectedOrigin = process.env.ORIGIN || 'http://localhost:3000';
const expectedRPID = process.env.RP_ID || 'localhost';

export class WebAuthnService {
  private static instance: WebAuthnService;

  private constructor() {
    console.log('WebAuthn Configuration:', {
      rpName,
      rpID,
      expectedOrigin,
      expectedRPID,
    });
  }

  public static getInstance(): WebAuthnService {
    if (!WebAuthnService.instance) {
      WebAuthnService.instance = new WebAuthnService();
    }
    return WebAuthnService.instance;
  }

  public async generateRegistrationOptions(
    userId: string,
    username: string,
    deviceName: string
  ) {
    try {
      console.log('Generating registration options for:', {
        userId,
        username,
        deviceName,
        config: {
          rpName,
          rpID,
          expectedOrigin,
          expectedRPID,
        },
      });

      // Get existing authenticators for user
      let existingDevices;
      try {
        existingDevices = await db.authenticator.findMany({
          where: { userId },
        });
        console.log('Existing devices:', existingDevices);
      } catch (dbError) {
        console.error('Error fetching existing devices:', dbError);
        throw new AppError(500, 'Failed to fetch existing authenticators', { cause: dbError });
      }

      let options;
      try {
        options = await generateRegistrationOptions({
          rpName,
          rpID: expectedRPID,
          userID: userId,
          userName: username,
          userDisplayName: username,
          attestationType: 'none',
          authenticatorSelection: {
            residentKey: 'preferred',
            userVerification: 'preferred',
            authenticatorAttachment: 'cross-platform',
          },
          excludeCredentials: existingDevices.map(device => ({
            id: Buffer.from(device.credentialID, 'base64'),
            type: 'public-key',
            transports: device.transports as AuthenticatorTransport[],
          })),
        });
        console.log('Generated registration options:', options);
      } catch (webAuthnError) {
        console.error('Error generating WebAuthn options:', webAuthnError);
        throw new AppError(500, 'Failed to generate WebAuthn options', { cause: webAuthnError });
      }

      // Store challenge
      try {
        await db.challenge.create({
          data: {
            challenge: options.challenge,
            userId,
          },
        });
        console.log('Stored challenge in database');
      } catch (dbError) {
        console.error('Error storing challenge:', dbError);
        throw new AppError(500, 'Failed to store challenge', { cause: dbError });
      }

      return options;
    } catch (error) {
      console.error('Error in generateRegistrationOptions:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to generate registration options', { cause: error });
    }
  }

  public async verifyRegistration(
    userId: string,
    deviceName: string,
    response: RegistrationResponseJSON
  ) {
    try {
      // Get challenge
      const expectedChallenge = await db.challenge.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (!expectedChallenge) {
        throw new AppError(400, 'Challenge not found');
      }

      let verification: VerifiedRegistrationResponse;
      try {
        verification = await verifyRegistrationResponse({
          response,
          expectedChallenge: expectedChallenge.challenge,
          expectedOrigin,
          expectedRPID,
          requireUserVerification: true,
        });
      } catch (error) {
        console.error('Error verifying registration:', error);
        throw new AppError(400, 'Invalid registration response', { cause: error });
      }

      const { verified, registrationInfo } = verification;

      if (!verified || !registrationInfo) {
        throw new AppError(400, 'Registration verification failed');
      }

      const {
        credentialID,
        credentialPublicKey,
        counter,
        credentialDeviceType,
        credentialBackedUp,
      } = registrationInfo;

      // Save authenticator
      const newDevice = await db.authenticator.create({
        data: {
          credentialID: Buffer.from(credentialID).toString('base64'),
          credentialPublicKey: Buffer.from(credentialPublicKey).toString('base64'),
          counter,
          deviceType: credentialDeviceType,
          backedUp: credentialBackedUp,
          deviceName,
          transports: response.response.transports || [],
          userId,
        },
      });

      // Delete challenge
      await db.challenge.delete({
        where: { id: expectedChallenge.id },
      });

      return newDevice;
    } catch (error) {
      console.error('Error in verifyRegistration:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to verify registration', { cause: error });
    }
  }

  public async generateAuthenticationOptions(email: string) {
    try {
      const user = await db.user.findUnique({
        where: { email },
        include: { authenticators: true },
      });

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      const options = await generateAuthenticationOptions({
        rpID: expectedRPID,
        allowCredentials: user.authenticators.map(device => ({
          id: Buffer.from(device.credentialID, 'base64'),
          type: 'public-key',
          transports: device.transports as AuthenticatorTransport[],
        })),
        userVerification: 'preferred',
      });

      // Store challenge
      await db.challenge.create({
        data: {
          challenge: options.challenge,
          userId: user.id,
        },
      });

      return options;
    } catch (error) {
      console.error('Error generating authentication options:', error);
      throw new AppError(500, 'Failed to generate authentication options', { cause: error });
    }
  }

  public async verifyAuthentication(
    email: string,
    response: AuthenticationResponseJSON
  ) {
    try {
      const user = await db.user.findUnique({
        where: { email },
        include: { authenticators: true },
      });

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      const expectedChallenge = await db.challenge.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });

      if (!expectedChallenge) {
        throw new AppError(400, 'Challenge not found');
      }

      const authenticator = user.authenticators.find(
        device => device.credentialID === response.id
      );

      if (!authenticator) {
        throw new AppError(400, 'Authenticator not found');
      }

      let verification: VerifiedAuthenticationResponse;
      try {
        verification = await verifyAuthenticationResponse({
          response,
          expectedChallenge: expectedChallenge.challenge,
          expectedOrigin,
          expectedRPID,
          authenticator: {
            credentialID: Buffer.from(authenticator.credentialID, 'base64'),
            credentialPublicKey: Buffer.from(authenticator.credentialPublicKey, 'base64'),
            counter: authenticator.counter,
            transports: authenticator.transports as AuthenticatorTransport[],
          },
          requireUserVerification: true,
        });
      } catch (error) {
        console.error('Error verifying authentication:', error);
        throw new AppError(400, 'Invalid authentication response', { cause: error });
      }

      const { verified, authenticationInfo } = verification;

      if (!verified) {
        throw new AppError(401, 'Authentication failed');
      }

      // Update authenticator counter
      await db.authenticator.update({
        where: { id: authenticator.id },
        data: { counter: authenticationInfo.newCounter },
      });

      // Delete challenge
      await db.challenge.delete({
        where: { id: expectedChallenge.id },
      });

      return authenticator;
    } catch (error) {
      console.error('Error in verifyAuthentication:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Failed to verify authentication', { cause: error });
    }
  }

  public async listAuthenticators(userId: string) {
    try {
      return await db.authenticator.findMany({
        where: { userId },
        select: {
          id: true,
          deviceName: true,
          deviceType: true,
          backedUp: true,
          transports: true,
          createdAt: true,
        },
      });
    } catch (error) {
      console.error('Error listing authenticators:', error);
      throw new AppError(500, 'Failed to list authenticators', { cause: error });
    }
  }

  public async removeAuthenticator(authenticatorId: string, userId: string) {
    try {
      const authenticator = await db.authenticator.findUnique({
        where: { id: authenticatorId },
      });

      if (!authenticator || authenticator.userId !== userId) {
        throw new AppError(404, 'Authenticator not found');
      }

      await db.authenticator.delete({ where: { id: authenticatorId } });
    } catch (error) {
      console.error('Error removing authenticator:', error);
      throw new AppError(500, 'Failed to remove authenticator', { cause: error });
    }
  }
}
