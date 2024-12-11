import { AuditService } from './AuditService';
import { AuditEventType } from '../types/audit';
import { ThreatDetectionService } from './ThreatDetectionService';
import { WebAuthnService } from './WebAuthnService';

export enum TwoFactorMethod {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  AUTHENTICATOR = 'AUTHENTICATOR',
  BACKUP_CODES = 'BACKUP_CODES',
  WEBAUTHN = 'WEBAUTHN'
}

export interface TwoFactorSetup {
  secret?: string;
  qrCode?: string;
  backupCodes?: string[];
  recoveryEmail?: string;
  phoneNumber?: string;
  webAuthnCredentialId?: string;
}

export interface TwoFactorVerification {
  method: TwoFactorMethod;
  timestamp: number;
  deviceInfo: {
    userAgent: string;
    ipAddress: string;
  };
}

class TwoFactorAuthService {
  private static instance: TwoFactorAuthService;
  private readonly BACKUP_CODES_COUNT = 10;
  private readonly CODE_EXPIRY = 10 * 60 * 1000; // 10 minutes
  private readonly MAX_ATTEMPTS = 3;

  private userMethods: Map<string, Set<TwoFactorMethod>> = new Map();
  private verificationAttempts: Map<string, number> = new Map();
  private pendingCodes: Map<string, { code: string; expires: number }> = new Map();
  private webAuthnCredentials: Map<string, string> = new Map(); // userId -> credentialId

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): TwoFactorAuthService {
    if (!TwoFactorAuthService.instance) {
      TwoFactorAuthService.instance = new TwoFactorAuthService();
    }
    return TwoFactorAuthService.instance;
  }

  /**
   * Set up WebAuthn-based 2FA
   */
  public async setupWebAuthn(
    userId: string,
    username: string
  ): Promise<TwoFactorSetup> {
    try {
      const webAuthnService = WebAuthnService.getInstance();

      // Check if WebAuthn is supported
      if (!webAuthnService.isSupported()) {
        throw new Error('WebAuthn is not supported in this browser');
      }

      // Register WebAuthn credential
      const success = await webAuthnService.register(username, userId);

      if (!success) {
        throw new Error('Failed to register WebAuthn credential');
      }

      // Store credential ID
      this.webAuthnCredentials.set(userId, credential.id);

      // Update user's 2FA methods
      this.addUserMethod(userId, TwoFactorMethod.WEBAUTHN);

      await AuditService.getInstance().logSecurityEvent({
        type: 'TWO_FACTOR_SETUP',
        status: 'SUCCESS',
        userId,
        details: {
          method: TwoFactorMethod.WEBAUTHN,
          credentialId: credential.id
        }
      });

      return {
        webAuthnCredentialId: credential.id
      };
    } catch (error) {
      await this.handleSetupError(userId, TwoFactorMethod.WEBAUTHN, error);
      throw error;
    }
  }

  /**
   * Set up SMS-based 2FA
   */
  public async setupSMS(
    userId: string,
    phoneNumber: string
  ): Promise<TwoFactorSetup> {
    try {
      // Validate phone number format
      if (!this.isValidPhoneNumber(phoneNumber)) {
        throw new Error('Invalid phone number format');
      }

      // Generate and send verification code
      const verificationCode = this.generateVerificationCode();
      await this.sendSMSCode(phoneNumber, verificationCode);

      // Store pending verification
      this.storePendingCode(userId, verificationCode);

      // Update user's 2FA methods
      this.addUserMethod(userId, TwoFactorMethod.SMS);

      await AuditService.getInstance().logSecurityEvent({
        type: 'TWO_FACTOR_SETUP',
        status: 'SUCCESS',
        userId,
        details: {
          method: TwoFactorMethod.SMS,
          phoneNumber: this.maskPhoneNumber(phoneNumber)
        }
      });

      return {
        phoneNumber: this.maskPhoneNumber(phoneNumber)
      };
    } catch (error) {
      await this.handleSetupError(userId, TwoFactorMethod.SMS, error);
      throw error;
    }
  }

  /**
   * Set up email-based 2FA
   */
  public async setupEmail(
    userId: string,
    email: string
  ): Promise<TwoFactorSetup> {
    try {
      // Validate email format
      if (!this.isValidEmail(email)) {
        throw new Error('Invalid email format');
      }

      // Generate and send verification code
      const verificationCode = this.generateVerificationCode();
      await this.sendEmailCode(email, verificationCode);

      // Store pending verification
      this.storePendingCode(userId, verificationCode);

      // Update user's 2FA methods
      this.addUserMethod(userId, TwoFactorMethod.EMAIL);

      await AuditService.getInstance().logSecurityEvent({
        type: 'TWO_FACTOR_SETUP',
        status: 'SUCCESS',
        userId,
        details: {
          method: TwoFactorMethod.EMAIL,
          email: this.maskEmail(email)
        }
      });

      return {
        recoveryEmail: this.maskEmail(email)
      };
    } catch (error) {
      await this.handleSetupError(userId, TwoFactorMethod.EMAIL, error);
      throw error;
    }
  }

  /**
   * Verify 2FA code or WebAuthn
   */
  public async verify(
    userId: string,
    method: TwoFactorMethod,
    code: string | null,
    deviceInfo: { userAgent: string; ipAddress: string }
  ): Promise<boolean> {
    try {
      // Check if method is enabled for user
      if (!this.hasMethod(userId, method)) {
        throw new Error(`2FA method ${method} not enabled for user`);
      }

      // Check attempt limits
      if (this.isRateLimited(userId)) {
        throw new Error('Too many verification attempts. Please try again later.');
      }

      let isValid = false;

      if (method === TwoFactorMethod.WEBAUTHN) {
        const credentialId = this.webAuthnCredentials.get(userId);
        if (!credentialId) {
          throw new Error('WebAuthn credential not found');
        }
        isValid = await WebAuthnService.getInstance().authenticate(credentialId);
      } else {
        // Verify code for other methods
        if (!code) {
          throw new Error('Verification code is required');
        }
        isValid = await this.verifyCode(userId, method, code);
      }

      if (isValid) {
        // Reset attempts on successful verification
        this.verificationAttempts.delete(userId);

        await AuditService.getInstance().logSecurityEvent({
          type: 'TWO_FACTOR_VERIFICATION',
          status: 'SUCCESS',
          userId,
          details: {
            method,
            deviceInfo
          }
        });

        return true;
      }

      // Increment failed attempts
      this.incrementAttempts(userId);

      await AuditService.getInstance().logSecurityEvent({
        type: 'TWO_FACTOR_VERIFICATION',
        status: 'FAILED',
        userId,
        details: {
          method,
          deviceInfo,
          remainingAttempts: this.MAX_ATTEMPTS - this.getAttempts(userId)
        }
      });

      return false;
    } catch (error) {
      await ThreatDetectionService.getInstance().reportThreat({
        type: 'AUTHENTICATION_FAILURE',
        severity: 'HIGH',
        details: {
          method: '2FA',
          userId,
          error: error.message
        }
      });

      throw error;
    }
  }

  // Helper methods...
  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Implement phone number validation
    return /^\+[1-9]\d{1,14}$/.test(phoneNumber);
  }

  private isValidEmail(email: string): boolean {
    // Implement email validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private generateVerificationCode(): string {
    // Generate a 6-digit code
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async sendSMSCode(phoneNumber: string, code: string): Promise<void> {
    // Implement SMS sending logic
  }

  private async sendEmailCode(email: string, code: string): Promise<void> {
    // Implement email sending logic
  }

  private maskPhoneNumber(phoneNumber: string): string {
    return phoneNumber.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    return `${local[0]}****${local.slice(-1)}@${domain}`;
  }

  private addUserMethod(userId: string, method: TwoFactorMethod): void {
    const methods = this.userMethods.get(userId) || new Set();
    methods.add(method);
    this.userMethods.set(userId, methods);
  }

  private hasMethod(userId: string, method: TwoFactorMethod): boolean {
    return this.userMethods.get(userId)?.has(method) || false;
  }

  private async handleSetupError(
    userId: string,
    method: TwoFactorMethod,
    error: Error
  ): Promise<void> {
    await AuditService.getInstance().logSecurityEvent({
      type: 'TWO_FACTOR_SETUP',
      status: 'FAILED',
      userId,
      details: {
        method,
        error: error.message
      }
    });

    await ThreatDetectionService.getInstance().reportThreat({
      type: 'AUTHENTICATION_FAILURE',
      severity: 'MEDIUM',
      details: {
        method: '2FA_SETUP',
        userId,
        error: error.message
      }
    });
  }

  private isRateLimited(userId: string): boolean {
    return this.getAttempts(userId) >= this.MAX_ATTEMPTS;
  }

  private getAttempts(userId: string): number {
    return this.verificationAttempts.get(userId) || 0;
  }

  private incrementAttempts(userId: string): void {
    const attempts = this.getAttempts(userId);
    this.verificationAttempts.set(userId, attempts + 1);
  }
}

export default TwoFactorAuthService.getInstance();
