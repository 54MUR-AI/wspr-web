import React, { useState } from 'react';
import WebAuthnLogin from '../components/auth/WebAuthnLogin';
import WebAuthnRegister from '../components/auth/WebAuthnRegister';
import RecoveryKeySetup from '../components/auth/RecoveryKeySetup';
import RecoveryKeyLogin from '../components/auth/RecoveryKeyLogin';

type AuthMode = 'register' | 'login';
type AuthMethod = 'webauthn' | 'recovery' | null;

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [method, setMethod] = useState<AuthMethod>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSuccess = (token?: string) => {
    if (mode === 'register') {
      setMessage({
        type: 'success',
        text: 'Registration successful! You can now log in.'
      });
      // Reset to login mode after successful registration
      setTimeout(() => {
        setMode('login');
        setMethod(null);
        setMessage(null);
      }, 2000);
    } else if (token) {
      setMessage({
        type: 'success',
        text: 'Login successful! Redirecting...'
      });
      // Store token and redirect
      localStorage.setItem('auth_token', token);
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    }
  };

  const handleError = (error: Error) => {
    setMessage({
      type: 'error',
      text: error.message
    });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-gray-900 mb-8">
          {mode === 'register' ? 'Create Account' : 'Welcome Back'}
        </h1>

        {message && (
          <div
            className={`mb-4 p-4 rounded-md ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {!method ? (
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="space-y-6">
              <button
                onClick={() => setMethod('webauthn')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {mode === 'register' ? 'Register Security Key' : 'Login with Security Key'}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>

              <button
                onClick={() => setMethod('recovery')}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {mode === 'register' ? 'Setup Recovery Key' : 'Use Recovery Key'}
              </button>

              <div className="text-center">
                <button
                  onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  {mode === 'register'
                    ? 'Already have an account? Sign in'
                    : 'Need an account? Register'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {method === 'webauthn' && mode === 'register' && (
              <WebAuthnRegister
                onSuccess={handleSuccess}
                onError={handleError}
              />
            )}
            {method === 'webauthn' && mode === 'login' && (
              <WebAuthnLogin
                onSuccess={handleSuccess}
                onError={handleError}
              />
            )}
            {method === 'recovery' && mode === 'register' && (
              <RecoveryKeySetup
                onSuccess={handleSuccess}
                onError={handleError}
              />
            )}
            {method === 'recovery' && mode === 'login' && (
              <RecoveryKeyLogin
                onSuccess={handleSuccess}
                onError={handleError}
              />
            )}

            <div className="mt-6">
              <button
                onClick={() => setMethod(null)}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Options
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
