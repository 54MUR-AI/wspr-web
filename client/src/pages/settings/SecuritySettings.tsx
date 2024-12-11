import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import { WebAuthnAuth } from '../../components/WebAuthn/WebAuthnAuth';
import { RecoveryKeyManager } from '../../components/Recovery/RecoveryKeyManager';

export const SecuritySettings: React.FC = () => {
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Security Settings
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        Manage your security settings, including WebAuthn credentials and recovery keys.
      </Typography>

      {/* WebAuthn Section */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Security Keys (WebAuthn)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Use your device's built-in authenticator (fingerprint, face recognition) or a security key
            for passwordless login.
          </Typography>
          <WebAuthnAuth mode="register" />
        </CardContent>
      </Card>

      <Divider sx={{ my: 4 }} />

      {/* Recovery Keys Section */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recovery Keys
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Recovery keys help you regain access to your account if you lose access to your security keys.
            Store them in a secure location.
          </Typography>
          <RecoveryKeyManager />
        </CardContent>
      </Card>
    </Box>
  );
};
