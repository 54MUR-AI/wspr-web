import { GroupMember, GroupRole, MessageType } from '../types/group';

export enum AuditEventType {
  // Authentication Events
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  MFA_ENABLED = 'MFA_ENABLED',
  MFA_DISABLED = 'MFA_DISABLED',

  // Key Management Events
  KEY_ROTATION_INITIATED = 'KEY_ROTATION_INITIATED',
  KEY_ROTATION_COMPLETED = 'KEY_ROTATION_COMPLETED',
  KEY_ROTATION_FAILED = 'KEY_ROTATION_FAILED',
  EMERGENCY_ROTATION_INITIATED = 'EMERGENCY_ROTATION_INITIATED',
  KEY_BUNDLE_CREATED = 'KEY_BUNDLE_CREATED',
  KEY_BUNDLE_DELIVERED = 'KEY_BUNDLE_DELIVERED',

  // Group Events
  GROUP_CREATED = 'GROUP_CREATED',
  GROUP_DELETED = 'GROUP_DELETED',
  MEMBER_ADDED = 'MEMBER_ADDED',
  MEMBER_REMOVED = 'MEMBER_REMOVED',
  ROLE_CHANGED = 'ROLE_CHANGED',

  // Message Events
  MESSAGE_SENT = 'MESSAGE_SENT',
  MESSAGE_EDITED = 'MESSAGE_EDITED',
  MESSAGE_DELETED = 'MESSAGE_DELETED',
  FILE_UPLOADED = 'FILE_UPLOADED',
  FILE_DOWNLOADED = 'FILE_DOWNLOADED',

  // Security Events
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  ENCRYPTION_ERROR = 'ENCRYPTION_ERROR',
  DECRYPTION_ERROR = 'DECRYPTION_ERROR'
}

export interface AuditEvent {
  id: string;
  type: AuditEventType;
  timestamp: Date;
  userId: string;
  groupId?: string;
  metadata: Record<string, any>;
  severity: AuditSeverity;
  status: AuditStatus;
}

export enum AuditSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

export enum AuditStatus {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  IN_PROGRESS = 'IN_PROGRESS'
}

class AuditService {
  private events: AuditEvent[] = [];
  private readonly MAX_EVENTS = 10000;
  private readonly RETENTION_PERIOD = 30 * 24 * 60 * 60 * 1000; // 30 days

  constructor() {
    // Set up periodic cleanup
    setInterval(() => this.cleanupOldEvents(), this.RETENTION_PERIOD);
  }

  /**
   * Log an audit event
   */
  async logEvent(
    type: AuditEventType,
    userId: string,
    metadata: Record<string, any> = {},
    severity: AuditSeverity = AuditSeverity.INFO,
    status: AuditStatus = AuditStatus.SUCCESS,
    groupId?: string
  ): Promise<AuditEvent> {
    const event: AuditEvent = {
      id: crypto.randomUUID(),
      type,
      timestamp: new Date(),
      userId,
      groupId,
      metadata,
      severity,
      status
    };

    this.events.unshift(event);
    
    // Ensure we don't exceed max events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(0, this.MAX_EVENTS);
    }

    // Store event in persistent storage
    await this.persistEvent(event);

    // Alert on critical events
    if (severity === AuditSeverity.CRITICAL) {
      await this.alertCriticalEvent(event);
    }

    return event;
  }

  /**
   * Log a key rotation event
   */
  async logKeyRotation(
    userId: string,
    groupId: string,
    success: boolean,
    metadata: Record<string, any> = {}
  ): Promise<AuditEvent> {
    return await this.logEvent(
      success ? AuditEventType.KEY_ROTATION_COMPLETED : AuditEventType.KEY_ROTATION_FAILED,
      userId,
      metadata,
      success ? AuditSeverity.INFO : AuditSeverity.ERROR,
      success ? AuditStatus.SUCCESS : AuditStatus.FAILURE,
      groupId
    );
  }

  /**
   * Log an emergency key rotation
   */
  async logEmergencyRotation(
    userId: string,
    groupId: string,
    reason: string
  ): Promise<AuditEvent> {
    return await this.logEvent(
      AuditEventType.EMERGENCY_ROTATION_INITIATED,
      userId,
      { reason },
      AuditSeverity.CRITICAL,
      AuditStatus.IN_PROGRESS,
      groupId
    );
  }

  /**
   * Log a security event
   */
  async logSecurityEvent(
    type: AuditEventType,
    userId: string,
    details: Record<string, any>,
    severity: AuditSeverity
  ): Promise<AuditEvent> {
    return await this.logEvent(
      type,
      userId,
      details,
      severity,
      AuditStatus.SUCCESS
    );
  }

  /**
   * Query audit events with filters
   */
  async queryEvents(filters: {
    type?: AuditEventType;
    userId?: string;
    groupId?: string;
    severity?: AuditSeverity;
    startDate?: Date;
    endDate?: Date;
    status?: AuditStatus;
  }): Promise<AuditEvent[]> {
    return this.events.filter(event => {
      if (filters.type && event.type !== filters.type) return false;
      if (filters.userId && event.userId !== filters.userId) return false;
      if (filters.groupId && event.groupId !== filters.groupId) return false;
      if (filters.severity && event.severity !== filters.severity) return false;
      if (filters.status && event.status !== filters.status) return false;
      if (filters.startDate && event.timestamp < filters.startDate) return false;
      if (filters.endDate && event.timestamp > filters.endDate) return false;
      return true;
    });
  }

  /**
   * Get recent events for a specific group
   */
  async getGroupEvents(groupId: string, limit: number = 100): Promise<AuditEvent[]> {
    return this.events
      .filter(event => event.groupId === groupId)
      .slice(0, limit);
  }

  /**
   * Get security events for analysis
   */
  async getSecurityEvents(
    severity?: AuditSeverity,
    startDate?: Date
  ): Promise<AuditEvent[]> {
    return this.events.filter(event => {
      if (severity && event.severity !== severity) return false;
      if (startDate && event.timestamp < startDate) return false;
      return [
        AuditEventType.SUSPICIOUS_ACTIVITY,
        AuditEventType.RATE_LIMIT_EXCEEDED,
        AuditEventType.ENCRYPTION_ERROR,
        AuditEventType.DECRYPTION_ERROR
      ].includes(event.type);
    });
  }

  /**
   * Clean up old events
   */
  private cleanupOldEvents(): void {
    const cutoffDate = new Date(Date.now() - this.RETENTION_PERIOD);
    this.events = this.events.filter(event => event.timestamp >= cutoffDate);
  }

  /**
   * Persist event to storage
   */
  private async persistEvent(event: AuditEvent): Promise<void> {
    // In a real implementation, this would persist to a database or secure storage
    console.log('Persisting audit event:', event);
  }

  /**
   * Alert on critical events
   */
  private async alertCriticalEvent(event: AuditEvent): Promise<void> {
    // In a real implementation, this would send alerts through appropriate channels
    console.log('CRITICAL AUDIT EVENT:', event);
  }
}

export default new AuditService();
