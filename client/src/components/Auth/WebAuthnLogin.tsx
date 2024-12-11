import React, { useState, useEffect } from 'react';
import WebAuthnService from '../../services/WebAuthnService';

interface WebAuthnLoginProps {
  onSuccess?: (token: string) => void;
  onError?: (error: Error) => void;
}

const WebAuthnLogin: React.FC<WebAuthnLoginProps> = ({
  onSuccess,
  onError
}) => {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const webAuthnService = WebAuthnService.getInstance();

  useEffect(() => {
    checkSupport();
  }, []);

  const checkSupport = () => {
    const supported = webAuthnService.isWebAuthnSupported();
    setIsSupported(supported);
  };

  const handleAuthenticate = async () => {
    try {
      setIsAuthenticating(true);
      const result = await webAuthnService.authenticate();
      if (result.token && onSuccess) {
        onSuccess(result.token);
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      if (onError) {
        onError(error as Error);
      }
    } finally {
      setIsAuthenticating(false);
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
        <h2 className="text-xl font-semibold mb-4">Security Key Login</h2>

        <button
          onClick={handleAuthenticate}
          disabled={isAuthenticating}
          className={`w-full py-2 px-4 rounded-md text-white font-medium
            ${isAuthenticating
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
            }`}
        >
          {isAuthenticating ? 'Verifying...' : 'Login with Security Key'}
        </button>

        <p className="mt-4 text-sm text-gray-600">
          Use your registered security key or biometric authentication to log in.
        </p>
      </div>
    </div>
  );
};

export default WebAuthnLogin;
