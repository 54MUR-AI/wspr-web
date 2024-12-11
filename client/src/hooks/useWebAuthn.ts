import { useState, useEffect, useCallback } from 'react';
import { WebAuthnService } from '../services/WebAuthnService';
import {
  WebAuthnState,
  WebAuthnRegistrationOptions,
  WebAuthnAuthenticationOptions
} from '../types/webauthn';

const initialState: WebAuthnState = {
  isSupported: false,
  isRegistering: false,
  isAuthenticating: false,
  hasPlatformAuthenticator: false,
  error: null
};

export const useWebAuthn = () => {
  const [state, setState] = useState<WebAuthnState>(initialState);
  const webAuthnService = WebAuthnService.getInstance();

  const initialize = useCallback(async () => {
    const isSupported = webAuthnService.isWebAuthnSupported();
    const hasPlatformAuthenticator = await webAuthnService.hasPlatformAuthenticator();

    setState(prev => ({
      ...prev,
      isSupported,
      hasPlatformAuthenticator
    }));
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const register = async (email: string, name: string): Promise<string> => {
    setState(prev => ({ ...prev, isRegistering: true, error: null }));

    try {
      const token = await webAuthnService.register(email, name);
      setState(prev => ({ ...prev, isRegistering: false }));
      return token;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isRegistering: false,
        error: error.message
      }));
      throw error;
    }
  };

  const authenticate = async (email: string): Promise<string> => {
    setState(prev => ({ ...prev, isAuthenticating: true, error: null }));

    try {
      const token = await webAuthnService.authenticate(email);
      setState(prev => ({ ...prev, isAuthenticating: false }));
      return token;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isAuthenticating: false,
        error: error.message
      }));
      throw error;
    }
  };

  const getRegisteredCredentials = useCallback(async () => {
    return webAuthnService.getRegisteredCredentials();
  }, []);

  const removeCredential = useCallback(async (credentialId: string) => {
    return webAuthnService.removeCredential(credentialId);
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    state,
    register,
    authenticate,
    getRegisteredCredentials,
    removeCredential,
    initialize,
    clearError
  };
};
