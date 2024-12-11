import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Typography,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Paper,
    Divider
} from '@mui/material';
import { RecoveryKeyService } from '../../services/RecoveryKeyService';

interface RecoveryKeyManagerProps {
    onKeyGenerated?: () => void;
    onKeyVerified?: () => void;
}

export const RecoveryKeyManager: React.FC<RecoveryKeyManagerProps> = ({
    onKeyGenerated,
    onKeyVerified
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [recoveryKey, setRecoveryKey] = useState<string | null>(null);
    const [showGenerateDialog, setShowGenerateDialog] = useState(false);
    const [showVerifyDialog, setShowVerifyDialog] = useState(false);
    const [verifyInput, setVerifyInput] = useState('');
    const [metadata, setMetadata] = useState<{
        createdAt: string;
        lastVerified: string | null;
    } | null>(null);

    const recoveryService = RecoveryKeyService.getInstance();

    useEffect(() => {
        loadMetadata();
    }, []);

    const loadMetadata = async () => {
        try {
            const meta = await recoveryService.getRecoveryKeyMetadata();
            if (meta) {
                setMetadata({
                    createdAt: meta.createdAt,
                    lastVerified: meta.lastVerified
                });
            }
        } catch (error) {
            console.error('Failed to load recovery key metadata:', error);
        }
    };

    const handleGenerateKey = async () => {
        setLoading(true);
        setError(null);
        try {
            const key = await recoveryService.generateRecoveryKey();
            setRecoveryKey(key);
            setShowGenerateDialog(true);
            await loadMetadata();
            if (onKeyGenerated) {
                onKeyGenerated();
            }
        } catch (err: any) {
            setError(err.message || 'Failed to generate recovery key');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyKey = async () => {
        setLoading(true);
        setError(null);
        try {
            const isValid = await recoveryService.verifyRecoveryKey(verifyInput);
            if (isValid) {
                await loadMetadata();
                setShowVerifyDialog(false);
                setVerifyInput('');
                if (onKeyVerified) {
                    onKeyVerified();
                }
            } else {
                setError('Invalid recovery key');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to verify recovery key');
        } finally {
            setLoading(false);
        }
    };

    const handleInvalidateKey = async () => {
        setLoading(true);
        setError(null);
        try {
            await recoveryService.invalidateRecoveryKey();
            setMetadata(null);
            setRecoveryKey(null);
        } catch (err: any) {
            setError(err.message || 'Failed to invalidate recovery key');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
                Recovery Key Management
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Recovery Key Status
                </Typography>

                {metadata ? (
                    <Box>
                        <Typography variant="body1" gutterBottom>
                            Created: {formatDate(metadata.createdAt)}
                        </Typography>
                        {metadata.lastVerified && (
                            <Typography variant="body1" gutterBottom>
                                Last Verified: {formatDate(metadata.lastVerified)}
                            </Typography>
                        )}
                        <Box sx={{ mt: 2 }}>
                            <Button
                                variant="outlined"
                                color="primary"
                                onClick={() => setShowVerifyDialog(true)}
                                sx={{ mr: 2 }}
                                disabled={loading}
                            >
                                Verify Key
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                onClick={handleInvalidateKey}
                                disabled={loading}
                            >
                                Invalidate Key
                            </Button>
                        </Box>
                    </Box>
                ) : (
                    <Box>
                        <Typography variant="body1" gutterBottom>
                            No recovery key has been generated.
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleGenerateKey}
                            disabled={loading}
                            sx={{ mt: 2 }}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Generate Recovery Key'}
                        </Button>
                    </Box>
                )}
            </Paper>

            <Dialog
                open={showGenerateDialog}
                onClose={() => setShowGenerateDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Your Recovery Key</DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Save this key in a secure location. It will only be shown once and cannot be recovered if lost.
                    </Alert>
                    <Paper
                        sx={{
                            p: 2,
                            backgroundColor: 'grey.100',
                            textAlign: 'center',
                            fontFamily: 'monospace',
                            fontSize: '1.2em',
                            wordBreak: 'break-all'
                        }}
                    >
                        {recoveryKey}
                    </Paper>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowGenerateDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={showVerifyDialog}
                onClose={() => {
                    setShowVerifyDialog(false);
                    setVerifyInput('');
                    setError(null);
                }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Verify Recovery Key</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Enter Recovery Key"
                        value={verifyInput}
                        onChange={(e) => setVerifyInput(e.target.value)}
                        margin="normal"
                        variant="outlined"
                        error={!!error}
                        helperText={error}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setShowVerifyDialog(false);
                        setVerifyInput('');
                        setError(null);
                    }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleVerifyKey}
                        disabled={!verifyInput.trim() || loading}
                        variant="contained"
                    >
                        {loading ? <CircularProgress size={24} /> : 'Verify'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
