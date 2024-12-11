import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Container,
  Typography,
} from '@mui/material';
import { monitoringService } from '../services/monitoring';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to monitoring service
    monitoringService.logError({
      error,
      errorInfo,
      location: window.location.href,
      timestamp: new Date().toISOString(),
    });
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleReport = () => {
    const { error, errorInfo } = this.state;
    const errorReport = {
      error: error?.toString(),
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      location: window.location.href,
    };

    monitoringService.reportError(errorReport);
  };

  public render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <Container maxWidth="sm">
          <Box
            sx={{
              mt: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Alert severity="error" sx={{ width: '100%' }}>
              <AlertTitle>Something went wrong</AlertTitle>
              We apologize for the inconvenience. Please try again or report the
              issue if it persists.
            </Alert>

            {process.env.NODE_ENV === 'development' && (
              <Box sx={{ mt: 2, width: '100%' }}>
                <Typography variant="h6" color="error" gutterBottom>
                  Error Details:
                </Typography>
                <Typography
                  variant="body2"
                  component="pre"
                  sx={{
                    p: 2,
                    backgroundColor: 'grey.100',
                    borderRadius: 1,
                    overflow: 'auto',
                  }}
                >
                  {error?.toString()}
                  {errorInfo?.componentStack}
                </Typography>
              </Box>
            )}

            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={this.handleRetry}
              >
                Try Again
              </Button>
              <Button
                variant="outlined"
                color="primary"
                onClick={this.handleReport}
              >
                Report Issue
              </Button>
            </Box>
          </Box>
        </Container>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
