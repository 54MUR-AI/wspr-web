import {
  startRegistration,
  startAuthentication,
} from '@simplewebauthn/browser';
import type { 
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/typescript-types';
import { api } from '../lib/axios';

class WebAuthnService {
  private static instance: WebAuthnService;

  private constructor() {}

  public static getInstance(): WebAuthnService {
    if (!WebAuthnService.instance) {
      WebAuthnService.instance = new WebAuthnService();
    }
    return WebAuthnService.instance;
  }

  /**
   * Start WebAuthn registration process
   */
  async startRegistration(username: string): Promise<{ verified: boolean }> {
    try {
      // Get registration options from server
      const { data: options } = await api.post<PublicKeyCredentialCreationOptionsJSON>(
        '/api/auth/webauthn/generate-registration-options',
        { username }
      );

      // Start registration process in browser
      const registrationResponse = await startRegistration(options);

      // Verify registration with server
      const { data: verificationResponse } = await api.post<{ verified: boolean }>(
        '/api/auth/webauthn/verify-registration',
        {
          response: registrationResponse,
        }
      );

      return verificationResponse;
    } catch (error: any) {
      console.error('WebAuthn Registration Error:', error);
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  }

  /**
   * Start WebAuthn authentication process
   */
  async startAuthentication(userId: string): Promise<{ verified: boolean; token?: string }> {
    try {
      // Get authentication options from server
      const { data: options } = await api.post<PublicKeyCredentialRequestOptionsJSON>(
        '/api/auth/webauthn/generate-authentication-options',
        { userId }
      );

      // Start authentication process in browser
      const authenticationResponse = await startAuthentication(options);

      // Verify authentication with server
      const { data: verificationResponse } = await api.post<{ verified: boolean; token?: string }>(
        '/api/auth/webauthn/verify-authentication',
        {
          userId,
          response: authenticationResponse,
        }
      );

      // If authentication was successful and we received a token, store it
      if (verificationResponse.verified && verificationResponse.token) {
        localStorage.setItem('token', verificationResponse.token);
      }

      return verificationResponse;
    } catch (error: any) {
      console.error('WebAuthn Authentication Error:', error);
      throw new Error(error.response?.data?.message || 'Authentication failed');
    }
  }

  /**
   * Check if WebAuthn is supported in the current browser
   */
  isWebAuthnSupported(): boolean {
    return window.PublicKeyCredential !== undefined;
  }

  /**
   * Check if platform authenticator is available
   */
  async isPlatformAuthenticatorAvailable(): Promise<boolean> {
    if (!this.isWebAuthnSupported()) {
      return false;
    }

    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch (error) {
      console.error('Error checking platform authenticator:', error);
      return false;
    }
  }
}
