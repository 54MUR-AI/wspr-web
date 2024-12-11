import React, { useEffect, useState } from 'react';
import { useWebAuthn } from '../../hooks/useWebAuthn';

interface WebAuthnAuthProps {
  credentialId: string;
  onAuthComplete?: (success: boolean) => void;
  onError?: (error: string) => void;
}

export const WebAuthnAuth: React.FC<WebAuthnAuthProps> = ({
  credentialId,
  onAuthComplete,
  onError
}) => {
  const {
    state: { isSupported, isAuthenticating, error },
    authenticate,
    initialize,
    clearError
  } = useWebAuthn();

  const [authAttempted, setAuthAttempted] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const handleAuthenticate = async () => {
    setAuthAttempted(true);
    try {
      const success = await authenticate(credentialId);
      if (onAuthComplete) {
        onAuthComplete(success);
      }
    } catch (err) {
      if (onError) {
        onError(err.message);
      }
    }
  };

  if (!isSupported) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-semibold text-red-700 mb-2">
          Security Key Not Available
        </h3>
        <p className="text-red-600">
          Your browser doesn't support security keys. Please use an alternative authentication method.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Security Key Authentication</h2>
      
      <div className="space-y-4">
        {/* Instructions */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-2">How to Use Your Security Key</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li>Make sure your security key is connected</li>
            <li>Click the "Authenticate" button below</li>
            <li>When prompted, interact with your security key</li>
          </ol>
        </div>

        {/* Action Button */}
        <button
          onClick={handleAuthenticate}
          disabled={isAuthenticating || authAttempted}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors
            ${isAuthenticating 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'}
          `}
        >
          {isAuthenticating ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Authenticating...
            </span>
          ) : authAttempted ? (
            'Authentication Complete'
          ) : (
            'Authenticate with Security Key'
          )}
        </button>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Authentication Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {error}
                </div>
                <button
                  onClick={clearError}
                  className="mt-2 text-sm font-medium text-red-600 hover:text-red-500"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Help Text */}
        <p className="text-sm text-gray-500 text-center">
          Having trouble? Make sure your security key is properly connected and try again.
          If problems persist, contact support or use an alternative authentication method.
        </p>
      </div>
    </div>
  );
};
