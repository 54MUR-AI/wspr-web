import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  AlertTitle,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  CircularProgress,
  TextField,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { api } from '../../lib/axios';

interface RecoveryKeyStatus {
  total: number;
  unused: number;
  expired: number;
}

export const RecoveryKeyManager: React.FC = () => {
  const [status, setStatus] = useState<RecoveryKeyStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);
  const [keyCount, setKeyCount] = useState(3);

  // Fetch recovery key status
  const fetchStatus = async () => {
    try {
      const { data } = await api.get<RecoveryKeyStatus>('/api/auth/recovery/status');
      setStatus(data);
    } catch (err: any) {
      setError('Failed to load recovery key status');
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Generate new recovery keys
  const handleGenerateKeys = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/api/auth/recovery/generate', { count: keyCount });
      setGeneratedKeys(data.keys);
      await fetchStatus();
    } catch (err: any) {
      setError('Failed to generate recovery keys');
    } finally {
      setLoading(false);
    }
  };

  // Clean up expired/used keys
  const handleCleanup = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post('/api/auth/recovery/cleanup');
      await fetchStatus();
    } catch (err: any) {
      setError('Failed to clean up recovery keys');
    } finally {
      setLoading(false);
    }
  };

  // Copy key to clipboard
  const handleCopyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
    } catch (err) {
      setError('Failed to copy key to clipboard');
    }
  };

  // Download keys as text file
  const handleDownloadKeys = () => {
    const content = generatedKeys.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recovery-keys.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Recovery Keys</Typography>
        <Box>
          <Button
            startIcon={<RefreshIcon />}
            onClick={handleCleanup}
            sx={{ mr: 1 }}
          >
            Clean Up
          </Button>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={() => setShowGenerateDialog(true)}
          >
            Generate Keys
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {status && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Status
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Chip
              label={`${status.unused} unused`}
              color="primary"
              variant="outlined"
            />
            <Chip
              label={`${status.expired} expired`}
              color="warning"
              variant="outlined"
            />
            <Chip
              label={`${status.total} total`}
              color="default"
              variant="outlined"
            />
          </Box>
        </Paper>
      )}

      {/* Generate Keys Dialog */}
      <Dialog
        open={showGenerateDialog}
        onClose={() => {
          setShowGenerateDialog(false);
          setGeneratedKeys([]);
          setKeyCount(3);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {generatedKeys.length ? 'Save Recovery Keys' : 'Generate Recovery Keys'}
        </DialogTitle>
        <DialogContent>
          {!generatedKeys.length ? (
            <Box sx={{ py: 2 }}>
              <TextField
                type="number"
                label="Number of keys"
                value={keyCount}
                onChange={(e) => setKeyCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                fullWidth
                InputProps={{ inputProps: { min: 1, max: 10 } }}
                helperText="You can generate between 1 and 10 keys"
              />
            </Box>
          ) : (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <AlertTitle>Important</AlertTitle>
                Save these recovery keys in a secure location. They will not be shown again.
              </Alert>
              <List>
                {generatedKeys.map((key, index) => (
                  <ListItem key={key}>
                    <ListItemText
                      primary={`Key ${index + 1}`}
                      secondary={key}
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Copy to clipboard">
                        <IconButton
                          edge="end"
                          onClick={() => handleCopyKey(key)}
                        >
                          <CopyIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <Button
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadKeys}
                  variant="outlined"
                >
                  Download Keys
                </Button>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowGenerateDialog(false);
              setGeneratedKeys([]);
              setKeyCount(3);
            }}
          >
            {generatedKeys.length ? 'Close' : 'Cancel'}
          </Button>
          {!generatedKeys.length && (
            <Button
              onClick={handleGenerateKeys}
              variant="contained"
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} />}
            >
              Generate
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};
