import { toast } from 'react-hot-toast';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorLog {
  timestamp: number;
  message: string;
  code: string;
  severity: ErrorSeverity;
  context?: Record<string, any>;
  stack?: string;
}

class ErrorService {
  private static instance: ErrorService;
  private errorLogs: ErrorLog[] = [];
  private readonly MAX_LOGS = 1000;

  private constructor() {}

  static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }

  handleError(
    error: Error | string,
    code: string,
    severity: ErrorSeverity = 'medium',
    context?: Record<string, any>
  ) {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = error instanceof Error ? error.stack : undefined;

    const errorLog: ErrorLog = {
      timestamp: Date.now(),
      message: errorMessage,
      code,
      severity,
      context,
      stack: errorStack,
    };

    this.logError(errorLog);
    this.notifyUser(errorLog);
    this.handleRecovery(errorLog);

    if (severity === 'critical') {
      this.handleCriticalError(errorLog);
    }

    return errorLog;
  }

  private logError(errorLog: ErrorLog) {
    this.errorLogs.unshift(errorLog);
    if (this.errorLogs.length > this.MAX_LOGS) {
      this.errorLogs.pop();
    }
    console.error('[WSPR Error]', errorLog);
  }

  private notifyUser(errorLog: ErrorLog) {
    const messages: Record<ErrorSeverity, string> = {
      low: 'Something went wrong. Please try again.',
      medium: 'An error occurred. Some features may be affected.',
      high: 'A significant error occurred. Please refresh the application.',
      critical: 'Critical error. Please contact support.',
    };

    toast.error(messages[errorLog.severity], {
      duration: errorLog.severity === 'critical' ? 10000 : 5000,
    });
  }

  private handleRecovery(errorLog: ErrorLog) {
    switch (errorLog.code) {
      case 'AUTH_TOKEN_EXPIRED':
        this.handleAuthTokenExpiry();
        break;
      case 'WEBSOCKET_DISCONNECTED':
        this.handleWebSocketDisconnection();
        break;
      case 'ENCRYPTION_FAILED':
        this.handleEncryptionFailure();
        break;
      default:
        // Default recovery actions
        break;
    }
  }

  private handleCriticalError(errorLog: ErrorLog) {
    // Save application state
    const state = this.captureApplicationState();
    localStorage.setItem('wspr_recovery_state', JSON.stringify(state));

    // Log to analytics/monitoring service
    this.logToMonitoring(errorLog);
  }

  private handleAuthTokenExpiry() {
    // Trigger re-authentication
    window.dispatchEvent(new CustomEvent('wspr:auth:refresh'));
  }

  private handleWebSocketDisconnection() {
    // Trigger WebSocket reconnection
    window.dispatchEvent(new CustomEvent('wspr:websocket:reconnect'));
  }

  private handleEncryptionFailure() {
    // Reset encryption keys and trigger re-exchange
    window.dispatchEvent(new CustomEvent('wspr:encryption:reset'));
  }

  private captureApplicationState() {
    return {
      timestamp: Date.now(),
      // Add relevant state data
    };
  }

  private logToMonitoring(errorLog: ErrorLog) {
    // Implement connection to monitoring service
    console.error('[WSPR Monitoring]', errorLog);
  }

  getErrorLogs(): ErrorLog[] {
    return [...this.errorLogs];
  }

  clearErrorLogs() {
    this.errorLogs = [];
  }
}

export const errorService = ErrorService.getInstance();
