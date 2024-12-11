import { useState, useCallback } from 'react';
import TwoFactorAuthService, {
  TwoFactorMethod,
  TwoFactorSetup,
  TwoFactorVerification
} from '../services/TwoFactorAuthService';

interface TwoFactorAuthState {
  isSettingUp: boolean;
  isVerifying: boolean;
  error: Error | null;
  setup: TwoFactorSetup | null;
  enabledMethods: TwoFactorMethod[];
}

interface UseTwoFactorAuthProps {
  userId: string;
  onSetupComplete?: (method: TwoFactorMethod) => void;
  onVerificationComplete?: (verification: TwoFactorVerification) => void;
}

export const useTwoFactorAuth = ({
  userId,
  onSetupComplete,
  onVerificationComplete
}: UseTwoFactorAuthProps) => {
  const [state, setState] = useState<TwoFactorAuthState>({
    isSettingUp: false,
    isVerifying: false,
    error: null,
    setup: null,
    enabledMethods: []
  });

  /**
   * Set up SMS-based 2FA
   */
  const setupSMS = useCallback(
    async (phoneNumber: string) => {
      setState(prev => ({ ...prev, isSettingUp: true, error: null }));
      try {
        const setup = await TwoFactorAuthService.setupSMS(userId, phoneNumber);
        setState(prev => ({
          ...prev,
          isSettingUp: false,
          setup,
          enabledMethods: [...prev.enabledMethods, TwoFactorMethod.SMS]
        }));
        onSetupComplete?.(TwoFactorMethod.SMS);
        return setup;
      } catch (err) {
        setState(prev => ({
          ...prev,
          isSettingUp: false,
          error: err instanceof Error ? err : new Error('Failed to set up SMS 2FA')
        }));
        throw err;
      }
    },
    [userId, onSetupComplete]
  );

  /**
   * Set up email-based 2FA
   */
  const setupEmail = useCallback(
    async (email: string) => {
      setState(prev => ({ ...prev, isSettingUp: true, error: null }));
      try {
        const setup = await TwoFactorAuthService.setupEmail(userId, email);
        setState(prev => ({
          ...prev,
          isSettingUp: false,
          setup,
          enabledMethods: [...prev.enabledMethods, TwoFactorMethod.EMAIL]
        }));
        onSetupComplete?.(TwoFactorMethod.EMAIL);
        return setup;
      } catch (err) {
        setState(prev => ({
          ...prev,
          isSettingUp: false,
          error: err instanceof Error ? err : new Error('Failed to set up email 2FA')
        }));
        throw err;
      }
    },
    [userId, onSetupComplete]
  );

  /**
   * Set up authenticator app-based 2FA
   */
  const setupAuthenticator = useCallback(async () => {
    setState(prev => ({ ...prev, isSettingUp: true, error: null }));
    try {
      const setup = await TwoFactorAuthService.setupAuthenticator(userId);
      setState(prev => ({
        ...prev,
        isSettingUp: false,
        setup,
        enabledMethods: [...prev.enabledMethods, TwoFactorMethod.AUTHENTICATOR]
      }));
      onSetupComplete?.(TwoFactorMethod.AUTHENTICATOR);
      return setup;
    } catch (err) {
      setState(prev => ({
        ...prev,
        isSettingUp: false,
        error: err instanceof Error ? err : new Error('Failed to set up authenticator 2FA')
      }));
      throw err;
    }
  }, [userId, onSetupComplete]);

  /**
   * Generate backup codes
   */
  const generateBackupCodes = useCallback(async () => {
    setState(prev => ({ ...prev, isSettingUp: true, error: null }));
    try {
      const backupCodes = await TwoFactorAuthService.generateBackupCodes(userId);
      setState(prev => ({
        ...prev,
        isSettingUp: false,
        setup: { ...prev.setup, backupCodes },
        enabledMethods: [...prev.enabledMethods, TwoFactorMethod.BACKUP_CODES]
      }));
      onSetupComplete?.(TwoFactorMethod.BACKUP_CODES);
      return backupCodes;
    } catch (err) {
      setState(prev => ({
        ...prev,
        isSettingUp: false,
        error: err instanceof Error ? err : new Error('Failed to generate backup codes')
      }));
      throw err;
    }
  }, [userId, onSetupComplete]);

  /**
   * Verify 2FA code
   */
  const verifyCode = useCallback(
    async (
      method: TwoFactorMethod,
      code: string,
      deviceInfo: { userAgent: string; ipAddress: string }
    ) => {
      setState(prev => ({ ...prev, isVerifying: true, error: null }));
      try {
        const isValid = await TwoFactorAuthService.verifyCode(
          userId,
          method,
          code,
          deviceInfo
        );

        setState(prev => ({ ...prev, isVerifying: false }));

        if (isValid) {
          const verification: TwoFactorVerification = {
            method,
            timestamp: Date.now(),
            deviceInfo
          };
          onVerificationComplete?.(verification);
        }

        return isValid;
      } catch (err) {
        setState(prev => ({
          ...prev,
          isVerifying: false,
          error: err instanceof Error ? err : new Error('Failed to verify code')
        }));
        throw err;
      }
    },
    [userId, onVerificationComplete]
  );

  /**
   * Get enabled 2FA methods
   */
  const getEnabledMethods = useCallback(async () => {
    try {
      const methods = await TwoFactorAuthService.getUserMethods(userId);
      setState(prev => ({ ...prev, enabledMethods: methods }));
      return methods;
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err : new Error('Failed to get enabled methods')
      }));
      throw err;
    }
  }, [userId]);

  return {
    ...state,
    setupSMS,
    setupEmail,
    setupAuthenticator,
    generateBackupCodes,
    verifyCode,
    getEnabledMethods
  };
};
