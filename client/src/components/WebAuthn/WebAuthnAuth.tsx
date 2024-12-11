import React, { useState, useEffect } from 'react';
import { Button, Alert, CircularProgress, Typography, Box } from '@mui/material';
import { WebAuthnService } from '../../services/webauthn.service';
import { useAuth } from '../../hooks/useAuth';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import SecurityIcon from '@mui/icons-material/Security';

const webAuthnService = WebAuthnService.getInstance();

interface WebAuthnAuthProps {
  mode: 'register' | 'authenticate';
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const WebAuthnAuth: React.FC<WebAuthnAuthProps> = ({
  mode,
  onSuccess,
  onError,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isPlatformAuthAvailable, setIsPlatformAuthAvailable] = useState(false);

  useEffect(() => {
    const checkSupport = async () => {
      const supported = webAuthnService.isWebAuthnSupported();
      setIsSupported(supported);

      if (supported) {
        const platformAuth = await webAuthnService.isPlatformAuthenticatorAvailable();
        setIsPlatformAuthAvailable(platformAuth);
      }
    };

    checkSupport();
  }, []);

  const handleRegistration = async () => {
    if (!user?.username) {
      setError('Username is required for registration');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await webAuthnService.startRegistration(user.username);
      if (result.verified) {
        onSuccess?.();
      } else {
        throw new Error('Registration failed');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Registration failed';
      setError(errorMessage);
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthentication = async () => {
    if (!user?.id) {
      setError('User ID is required for authentication');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await webAuthnService.startAuthentication(user.id);
      if (result.verified) {
        onSuccess?.();
      } else {
        throw new Error('Authentication failed');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Authentication failed';
      setError(errorMessage);
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <Alert severity="error">
        WebAuthn is not supported in your browser. Please use a modern browser that supports WebAuthn.
      </Alert>
    );
  }

  return (
    <Box sx={{ textAlign: 'center', py: 2 }}>
      <Box sx={{ mb: 2 }}>
        <SecurityIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
        <Typography variant="h6" gutterBottom>
          {mode === 'register' ? 'Register Security Key' : 'Authenticate with Security Key'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {isPlatformAuthAvailable
            ? 'Use your device\'s built-in authenticator (fingerprint, face recognition, or PIN)'
            : 'Use a security key or external authenticator'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={mode === 'register' ? handleRegistration : handleAuthentication}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} /> : <FingerprintIcon />}
        sx={{ minWidth: 200 }}
      >
        {loading
          ? mode === 'register'
            ? 'Registering...'
            : 'Authenticating...'
          : mode === 'register'
          ? 'Register Security Key'
          : 'Authenticate'}
      </Button>
    </Box>
  );
};
