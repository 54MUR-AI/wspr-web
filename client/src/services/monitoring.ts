import { ErrorInfo } from 'react';

interface ErrorLog {
  error: Error;
  errorInfo: ErrorInfo;
  location: string;
  timestamp: string;
}

interface ErrorReport {
  error?: string;
  stack?: string;
  componentStack?: string;
  userAgent: string;
  timestamp: string;
  location: string;
}

interface CallMetrics {
  userId: string;
  callId: string;
  timestamp: string;
  metrics: {
    packetsLost: number;
    jitter: number;
    roundTripTime: number;
    audioLevel?: number;
    frameRate?: number;
    resolution?: {
      width: number;
      height: number;
    };
  };
}

interface TransferMetrics {
  fileId: string;
  userId: string;
  timestamp: string;
  metrics: {
    bytesTransferred: number;
    totalBytes: number;
    speed: number;
    timeElapsed: number;
  };
}

class MonitoringService {
  private static instance: MonitoringService;
  private apiEndpoint: string;

  private constructor() {
    this.apiEndpoint = process.env.REACT_APP_API_URL || '';
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  public async logError(errorLog: ErrorLog): Promise<void> {
    try {
      await fetch(`${this.apiEndpoint}/api/monitoring/errors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorLog),
      });
    } catch (error) {
      console.error('Failed to log error:', error);
    }
  }

  public async reportError(errorReport: ErrorReport): Promise<void> {
    try {
      await fetch(`${this.apiEndpoint}/api/monitoring/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      });
    } catch (error) {
      console.error('Failed to report error:', error);
    }
  }

  public async trackCallQuality(metrics: CallMetrics): Promise<void> {
    try {
      await fetch(`${this.apiEndpoint}/api/monitoring/calls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metrics),
      });
    } catch (error) {
      console.error('Failed to track call quality:', error);
    }
  }

  public async trackFileTransfer(metrics: TransferMetrics): Promise<void> {
    try {
      await fetch(`${this.apiEndpoint}/api/monitoring/transfers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metrics),
      });
    } catch (error) {
      console.error('Failed to track file transfer:', error);
    }
  }

  public async trackPerformance(metric: string, value: number): Promise<void> {
    try {
      await fetch(`${this.apiEndpoint}/api/monitoring/performance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metric,
          value,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to track performance metric:', error);
    }
  }
}

export const monitoringService = MonitoringService.getInstance();
