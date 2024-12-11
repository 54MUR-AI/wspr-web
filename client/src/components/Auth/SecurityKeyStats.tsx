import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert
} from '@mui/material';
import { SecurityKeyUsageService } from '../../services/SecurityKeyUsageService';

interface SecurityEvent {
    type: string;
    status: string;
    timestamp: string;
    details: string;
    location?: string;
    userAgent?: string;
}

export const SecurityKeyStats: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [events, setEvents] = useState<SecurityEvent[]>([]);
    const [stats, setStats] = useState<{
        totalAuthentications: number;
        successfulAuthentications: number;
        failedAuthentications: number;
        lastUsed: string;
    }>({
        totalAuthentications: 0,
        successfulAuthentications: 0,
        failedAuthentications: 0,
        lastUsed: ''
    });

    const usageService = SecurityKeyUsageService.getInstance();

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            setLoading(true);
            const recentEvents = await usageService.getRecentEvents();
            const usageStats = await usageService.getUsageStats();

            setEvents(recentEvents);
            setStats(usageStats);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to load security statistics');
        } finally {
            setLoading(false);
        }
    };

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString();
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                {error}
            </Alert>
        );
    }

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Security Statistics
            </Typography>

            <Box sx={{ mb: 4 }}>
                <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Overview
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                        <Box>
                            <Typography variant="body2" color="text.secondary">
                                Total Authentications
                            </Typography>
                            <Typography variant="h6">
                                {stats.totalAuthentications}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="body2" color="text.secondary">
                                Successful Authentications
                            </Typography>
                            <Typography variant="h6" color="success.main">
                                {stats.successfulAuthentications}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="body2" color="text.secondary">
                                Failed Authentications
                            </Typography>
                            <Typography variant="h6" color="error.main">
                                {stats.failedAuthentications}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="body2" color="text.secondary">
                                Last Used
                            </Typography>
                            <Typography variant="h6">
                                {formatTimestamp(stats.lastUsed)}
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </Box>

            <Typography variant="h6" gutterBottom>
                Recent Events
            </Typography>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Time</TableCell>
                            <TableCell>Event</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Details</TableCell>
                            <TableCell>Location</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {events.map((event, index) => (
                            <TableRow key={index}>
                                <TableCell>{formatTimestamp(event.timestamp)}</TableCell>
                                <TableCell>{event.type}</TableCell>
                                <TableCell>
                                    <Typography
                                        color={event.status === 'success' ? 'success.main' : 'error.main'}
                                    >
                                        {event.status}
                                    </Typography>
                                </TableCell>
                                <TableCell>{event.details}</TableCell>
                                <TableCell>{event.location || 'Unknown'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};
