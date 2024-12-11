import { WebAuthnCredential } from '../types/webauthn';

interface UsageStats {
  lastUsed: string;
  totalUses: number;
  successfulAuths: number;
  failedAttempts: number;
  lastFailure?: string;
  lastFailureReason?: string;
  locations: Array<{
    ip: string;
    userAgent: string;
    timestamp: string;
  }>;
}

interface SecurityEvent {
  timestamp: string;
  eventType: 'auth_success' | 'auth_failure' | 'key_registered' | 'key_removed' | 'suspicious_activity';
  credentialId: string;
  deviceName: string;
  details: Record<string, any>;
  ip?: string;
  userAgent?: string;
}

class SecurityKeyUsageService {
  private static instance: SecurityKeyUsageService;
  private readonly STORAGE_KEY = 'wspr_security_key_usage';
  private readonly EVENTS_KEY = 'wspr_security_events';

  private constructor() {}

  static getInstance(): SecurityKeyUsageService {
    if (!SecurityKeyUsageService.instance) {
      SecurityKeyUsageService.instance = new SecurityKeyUsageService();
    }
    return SecurityKeyUsageService.instance;
  }

  async trackAuthSuccess(credential: WebAuthnCredential): Promise<void> {
    const stats = await this.getUsageStats(credential.credentialId);
    const updatedStats: UsageStats = {
      ...stats,
      lastUsed: new Date().toISOString(),
      totalUses: (stats?.totalUses || 0) + 1,
      successfulAuths: (stats?.successfulAuths || 0) + 1,
      locations: [
        ...(stats?.locations || []),
        {
          ip: await this.getClientIP(),
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      ]
    };

    await this.saveUsageStats(credential.credentialId, updatedStats);
    await this.logSecurityEvent({
      timestamp: new Date().toISOString(),
      eventType: 'auth_success',
      credentialId: credential.credentialId,
      deviceName: credential.deviceName,
      details: { usageCount: updatedStats.totalUses },
      ip: await this.getClientIP(),
      userAgent: navigator.userAgent
    });
  }

  async trackAuthFailure(credentialId: string, deviceName: string, reason: string): Promise<void> {
    const stats = await this.getUsageStats(credentialId);
    const updatedStats: UsageStats = {
      ...stats,
      failedAttempts: (stats?.failedAttempts || 0) + 1,
      lastFailure: new Date().toISOString(),
      lastFailureReason: reason,
      locations: [
        ...(stats?.locations || []),
        {
          ip: await this.getClientIP(),
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      ]
    };

    await this.saveUsageStats(credentialId, updatedStats);
    await this.logSecurityEvent({
      timestamp: new Date().toISOString(),
      eventType: 'auth_failure',
      credentialId,
      deviceName,
      details: { reason, failureCount: updatedStats.failedAttempts },
      ip: await this.getClientIP(),
      userAgent: navigator.userAgent
    });

    // Check for suspicious activity
    if (updatedStats.failedAttempts >= 3) {
      await this.logSecurityEvent({
        timestamp: new Date().toISOString(),
        eventType: 'suspicious_activity',
        credentialId,
        deviceName,
        details: {
          reason: 'Multiple failed authentication attempts',
          failureCount: updatedStats.failedAttempts
        },
        ip: await this.getClientIP(),
        userAgent: navigator.userAgent
      });
    }
  }

  async trackKeyRegistration(credential: WebAuthnCredential): Promise<void> {
    const initialStats: UsageStats = {
      lastUsed: new Date().toISOString(),
      totalUses: 0,
      successfulAuths: 0,
      failedAttempts: 0,
      locations: [{
        ip: await this.getClientIP(),
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }]
    };

    await this.saveUsageStats(credential.credentialId, initialStats);
    await this.logSecurityEvent({
      timestamp: new Date().toISOString(),
      eventType: 'key_registered',
      credentialId: credential.credentialId,
      deviceName: credential.deviceName,
      details: {},
      ip: await this.getClientIP(),
      userAgent: navigator.userAgent
    });
  }

  async trackKeyRemoval(credential: WebAuthnCredential): Promise<void> {
    // Log the removal event before removing stats
    await this.logSecurityEvent({
      timestamp: new Date().toISOString(),
      eventType: 'key_removed',
      credentialId: credential.credentialId,
      deviceName: credential.deviceName,
      details: {},
      ip: await this.getClientIP(),
      userAgent: navigator.userAgent
    });

    // Remove the usage stats
    await this.removeUsageStats(credential.credentialId);
  }

  async getUsageStats(credentialId: string): Promise<UsageStats | null> {
    const allStats = await this.getAllUsageStats();
    return allStats[credentialId] || null;
  }

  async getSecurityEvents(
    credentialId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<SecurityEvent[]> {
    const events = await this.getAllSecurityEvents();
    let filteredEvents = events;

    if (credentialId) {
      filteredEvents = filteredEvents.filter(event => event.credentialId === credentialId);
    }

    if (startDate) {
      filteredEvents = filteredEvents.filter(
        event => new Date(event.timestamp) >= startDate
      );
    }

    if (endDate) {
      filteredEvents = filteredEvents.filter(
        event => new Date(event.timestamp) <= endDate
      );
    }

    return filteredEvents.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  private async getAllUsageStats(): Promise<Record<string, UsageStats>> {
    const statsJson = localStorage.getItem(this.STORAGE_KEY);
    return statsJson ? JSON.parse(statsJson) : {};
  }

  private async saveUsageStats(credentialId: string, stats: UsageStats): Promise<void> {
    const allStats = await this.getAllUsageStats();
    allStats[credentialId] = stats;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allStats));
  }

  private async removeUsageStats(credentialId: string): Promise<void> {
    const allStats = await this.getAllUsageStats();
    delete allStats[credentialId];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allStats));
  }

  private async getAllSecurityEvents(): Promise<SecurityEvent[]> {
    const eventsJson = localStorage.getItem(this.EVENTS_KEY);
    return eventsJson ? JSON.parse(eventsJson) : [];
  }

  private async logSecurityEvent(event: SecurityEvent): Promise<void> {
    const events = await this.getAllSecurityEvents();
    events.push(event);
    
    // Keep only last 1000 events to prevent storage issues
    while (events.length > 1000) {
      events.shift();
    }
    
    localStorage.setItem(this.EVENTS_KEY, JSON.stringify(events));
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Failed to get client IP:', error);
      return 'unknown';
    }
  }
}

export const securityKeyUsageService = SecurityKeyUsageService.getInstance();
