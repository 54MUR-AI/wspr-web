import React, { useState, useEffect } from 'react';
import WebAuthnService from '../../services/WebAuthnService';

interface WebAuthnRegisterProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

const WebAuthnRegister: React.FC<WebAuthnRegisterProps> = ({
  onSuccess,
  onError
}) => {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isPlatformAvailable, setIsPlatformAvailable] = useState<boolean>(false);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const webAuthnService = WebAuthnService.getInstance();

  useEffect(() => {
    checkSupport();
  }, []);

  const checkSupport = async () => {
    const supported = webAuthnService.isWebAuthnSupported();
    setIsSupported(supported);

    if (supported) {
      const platformAuth = await webAuthnService.isPlatformAuthenticatorAvailable();
      setIsPlatformAvailable(platformAuth);
    }
  };

  const handleRegister = async () => {
    try {
      setIsRegistering(true);
      const success = await webAuthnService.registerAuthenticator();
      if (success && onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Registration failed:', error);
      if (onError) {
        onError(error as Error);
      }
    } finally {
      setIsRegistering(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        <p>WebAuthn is not supported in your browser. Please use a modern browser that supports WebAuthn.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Register Security Key</h2>
        
        {isPlatformAvailable && (
          <div className="mb-4 p-4 bg-blue-50 text-blue-700 rounded-md">
            <p>Your device supports biometric authentication!</p>
          </div>
        )}

        <button
          onClick={handleRegister}
          disabled={isRegistering}
          className={`w-full py-2 px-4 rounded-md text-white font-medium
            ${isRegistering 
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
            }`}
        >
          {isRegistering ? 'Registering...' : 'Register Security Key'}
        </button>

        <p className="mt-4 text-sm text-gray-600">
          {isPlatformAvailable
            ? 'You can use your device\'s built-in authentication (fingerprint, face recognition, etc.)'
            : 'You can register a USB security key or other external authenticator.'}
        </p>
      </div>
    </div>
  );
};

export default WebAuthnRegister;
