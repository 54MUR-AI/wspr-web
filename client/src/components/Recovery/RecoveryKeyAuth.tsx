import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import KeyIcon from '@mui/icons-material/Key';
import { api } from '../../lib/axios';
import { useAuth } from '../../hooks/useAuth';

interface RecoveryKeyAuthProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const RecoveryKeyAuth: React.FC<RecoveryKeyAuthProps> = ({
  onSuccess,
  onError,
}) => {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim() || !user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const { data } = await api.post('/api/auth/recovery/verify', {
        userId: user.id,
        key: key.trim(),
      });

      if (data.verified) {
        // Update auth context with new token
        if (data.token) {
          login(data.token);
        }
        onSuccess?.();
      } else {
        throw new Error('Invalid recovery key');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to verify recovery key';
      setError(errorMessage);
      onError?.(new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 400, mx: 'auto' }}>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <KeyIcon sx={{ fontSize: 48, color: 'primary.main' }} />
        
        <Typography variant="h6" align="center" gutterBottom>
          Enter Recovery Key
        </Typography>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
          Enter one of your recovery keys to regain access to your account.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        )}

        <TextField
          label="Recovery Key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          fullWidth
          autoFocus
          disabled={loading}
          placeholder="Enter your recovery key"
          sx={{ mb: 2 }}
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={loading || !key.trim()}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Verifying...' : 'Verify Recovery Key'}
        </Button>
      </Box>
    </Paper>
  );
};
