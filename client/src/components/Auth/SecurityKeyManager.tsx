import React, { useState } from 'react';
import {
    Box,
    Button,
    Typography,
    Alert,
    CircularProgress,
    Divider,
    Tabs,
    Tab,
    Paper
} from '@mui/material';
import { BiometricAuthService } from '../../services/BiometricAuthService';
import { SecurityKeyUsageService } from '../../services/SecurityKeyUsageService';
import { SecurityKeyStats } from './SecurityKeyStats';
import { RecoveryKeyManager } from './RecoveryKeyManager';

interface SecurityKeyManagerProps {
    username: string;
    displayName: string;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`security-tabpanel-${index}`}
            aria-labelledby={`security-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

export const SecurityKeyManager: React.FC<SecurityKeyManagerProps> = ({ username, displayName }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [hasBiometric, setHasBiometric] = useState(false);
    const [tabValue, setTabValue] = useState(0);

    const biometricService = BiometricAuthService.getInstance();
    const usageService = SecurityKeyUsageService.getInstance();

    React.useEffect(() => {
        checkBiometricAvailability();
    }, []);

    const checkBiometricAvailability = async () => {
        try {
            const available = await biometricService.isBiometricAvailable();
            setBiometricAvailable(available);
            // TODO: Check if user has registered biometric
        } catch (err) {
            console.error('Error checking biometric availability:', err);
            setBiometricAvailable(false);
        }
    };

    const handleRegisterBiometric = async () => {
        setLoading(true);
        setError(null);
        try {
            const success = await biometricService.registerBiometric(username, displayName);
            if (success) {
                setHasBiometric(true);
                usageService.logSecurityEvent({
                    type: 'biometric_registration',
                    status: 'success',
                    details: 'Biometric authentication registered successfully'
                });
            }
        } catch (err: any) {
            setError(err.message || 'Failed to register biometric authentication');
            usageService.logSecurityEvent({
                type: 'biometric_registration',
                status: 'failure',
                details: err.message
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveBiometric = async () => {
        setLoading(true);
        setError(null);
        try {
            const success = await biometricService.removeBiometric();
            if (success) {
                setHasBiometric(false);
                usageService.logSecurityEvent({
                    type: 'biometric_removal',
                    status: 'success',
                    details: 'Biometric authentication removed successfully'
                });
            }
        } catch (err: any) {
            setError(err.message || 'Failed to remove biometric authentication');
            usageService.logSecurityEvent({
                type: 'biometric_removal',
                status: 'failure',
                details: err.message
            });
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Paper sx={{ borderRadius: 1 }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    aria-label="security management tabs"
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab label="Security Keys" />
                    <Tab label="Recovery Keys" />
                    <Tab label="Statistics" />
                </Tabs>

                {error && (
                    <Alert severity="error" sx={{ m: 2 }}>
                        {error}
                    </Alert>
                )}

                <TabPanel value={tabValue} index={0}>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Biometric Authentication
                        </Typography>
                        {!biometricAvailable ? (
                            <Alert severity="info">
                                Biometric authentication is not available on this device.
                            </Alert>
                        ) : (
                            <>
                                {!hasBiometric ? (
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={handleRegisterBiometric}
                                        disabled={loading}
                                    >
                                        {loading ? <CircularProgress size={24} /> : 'Register Biometric Authentication'}
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        onClick={handleRemoveBiometric}
                                        disabled={loading}
                                    >
                                        {loading ? <CircularProgress size={24} /> : 'Remove Biometric Authentication'}
                                    </Button>
                                )}
                            </>
                        )}
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Hardware Security Keys
                        </Typography>
                        {/* TODO: Add hardware security key management */}
                    </Box>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <RecoveryKeyManager />
                </TabPanel>

                <TabPanel value={tabValue} index={2}>
                    <SecurityKeyStats />
                </TabPanel>
            </Paper>
        </Box>
    );
};
