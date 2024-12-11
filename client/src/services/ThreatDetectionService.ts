import { GroupMember } from '../types/group';
import { AuditEvent, AuditEventType } from './AuditService';

export enum ThreatType {
  BRUTE_FORCE = 'BRUTE_FORCE',
  SUSPICIOUS_LOGIN = 'SUSPICIOUS_LOGIN',
  RAPID_KEY_ROTATION = 'RAPID_KEY_ROTATION',
  ENCRYPTION_FAILURE = 'ENCRYPTION_FAILURE',
  ABNORMAL_BEHAVIOR = 'ABNORMAL_BEHAVIOR'
}

export enum ThreatLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum ThreatStatus {
  ACTIVE = 'ACTIVE',
  MITIGATED = 'MITIGATED',
  FALSE_POSITIVE = 'FALSE_POSITIVE'
}

export interface ThreatEvent {
  id: string;
  type: ThreatType;
  level: ThreatLevel;
  status: ThreatStatus;
  userId: string;
  groupId?: string;
  timestamp: number;
  description: string;
  metadata: Record<string, any>;
  mitigationSteps?: string[];
}

interface LoginAttemptMetrics {
  failedAttempts: number;
  lastAttemptTime: number;
  ipAddress: string;
  userAgent: string;
}

interface KeyRotationMetrics {
  rotationCount: number;
  lastRotationTime: number;
  initiatorIds: string[];
}

interface BehaviorMetrics {
  eventCounts: Record<AuditEventType, number>;
  lastEventTime: number;
  unusualPatterns: string[];
}

class ThreatDetectionService {
  private static instance: ThreatDetectionService;
  private loginMetrics: Map<string, LoginAttemptMetrics> = new Map();
  private keyRotationMetrics: Map<string, KeyRotationMetrics> = new Map();
  private behaviorMetrics: Map<string, BehaviorMetrics> = new Map();
  private activeThreats: ThreatEvent[] = [];

  private readonly LOGIN_ATTEMPT_WINDOW = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly KEY_ROTATION_WINDOW = 60 * 60 * 1000; // 1 hour
  private readonly MAX_KEY_ROTATIONS = 3;
  private readonly BEHAVIOR_ANALYSIS_WINDOW = 15 * 60 * 1000; // 15 minutes

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  public static getInstance(): ThreatDetectionService {
    if (!ThreatDetectionService.instance) {
      ThreatDetectionService.instance = new ThreatDetectionService();
    }
    return ThreatDetectionService.instance;
  }

  /**
   * Analyze login attempt for potential threats
   */
  public async analyzeLoginAttempt(
    userId: string,
    success: boolean,
    metadata: Record<string, any>
  ): Promise<ThreatEvent | null> {
    const now = Date.now();
    const metrics = this.getLoginMetrics(userId);

    // Update metrics
    if (!success) {
      metrics.failedAttempts++;
    } else {
      metrics.failedAttempts = 0;
    }
    metrics.lastAttemptTime = now;
    metrics.ipAddress = metadata.ipAddress;
    metrics.userAgent = metadata.userAgent;

    // Check for brute force attempts
    if (metrics.failedAttempts >= this.MAX_LOGIN_ATTEMPTS) {
      const threat: ThreatEvent = {
        id: this.generateThreatId(),
        type: ThreatType.BRUTE_FORCE,
        level: ThreatLevel.HIGH,
        status: ThreatStatus.ACTIVE,
        userId,
        timestamp: now,
        description: `Multiple failed login attempts detected from IP ${metrics.ipAddress}`,
        metadata: {
          failedAttempts: metrics.failedAttempts,
          ipAddress: metrics.ipAddress,
          userAgent: metrics.userAgent
        },
        mitigationSteps: [
          'Temporarily block IP address',
          'Require CAPTCHA for subsequent attempts',
          'Send security alert to user'
        ]
      };

      this.activeThreats.push(threat);
      return threat;
    }

    // Check for suspicious login patterns
    if (success && this.isSuspiciousLogin(metrics)) {
      const threat: ThreatEvent = {
        id: this.generateThreatId(),
        type: ThreatType.SUSPICIOUS_LOGIN,
        level: ThreatLevel.MEDIUM,
        status: ThreatStatus.ACTIVE,
        userId,
        timestamp: now,
        description: 'Suspicious login pattern detected',
        metadata: {
          ipAddress: metrics.ipAddress,
          userAgent: metrics.userAgent,
          previousAttempts: metrics.failedAttempts
        },
        mitigationSteps: [
          'Require two-factor authentication',
          'Monitor account activity',
          'Log suspicious IP address'
        ]
      };

      this.activeThreats.push(threat);
      return threat;
    }

    return null;
  }

  /**
   * Analyze key rotation for potential threats
   */
  public async analyzeKeyRotation(
    groupId: string,
    initiator: GroupMember
  ): Promise<ThreatEvent | null> {
    const now = Date.now();
    const metrics = this.getKeyRotationMetrics(groupId);

    // Update metrics
    metrics.rotationCount++;
    metrics.lastRotationTime = now;
    metrics.initiatorIds.push(initiator.id);

    // Check for rapid key rotations
    if (this.isRapidKeyRotation(metrics)) {
      const threat: ThreatEvent = {
        id: this.generateThreatId(),
        type: ThreatType.RAPID_KEY_ROTATION,
        level: ThreatLevel.HIGH,
        status: ThreatStatus.ACTIVE,
        userId: initiator.id,
        groupId,
        timestamp: now,
        description: 'Unusually frequent key rotations detected',
        metadata: {
          rotationCount: metrics.rotationCount,
          timeWindow: this.KEY_ROTATION_WINDOW,
          initiators: metrics.initiatorIds
        },
        mitigationSteps: [
          'Temporarily suspend key rotation capability',
          'Review recent group activity',
          'Notify group administrators'
        ]
      };

      this.activeThreats.push(threat);
      return threat;
    }

    return null;
  }

  /**
   * Analyze encryption failures
   */
  public async analyzeEncryptionFailure(
    userId: string,
    groupId: string,
    error: Error
  ): Promise<ThreatEvent | null> {
    const threat: ThreatEvent = {
      id: this.generateThreatId(),
      type: ThreatType.ENCRYPTION_FAILURE,
      level: ThreatLevel.CRITICAL,
      status: ThreatStatus.ACTIVE,
      userId,
      groupId,
      timestamp: Date.now(),
      description: 'Critical encryption failure detected',
      metadata: {
        error: error.message,
        stack: error.stack
      },
      mitigationSteps: [
        'Suspend message encryption/decryption',
        'Initiate emergency key rotation',
        'Alert security team'
      ]
    };

    this.activeThreats.push(threat);
    return threat;
  }

  /**
   * Analyze user behavior for anomalies
   */
  public async analyzeUserBehavior(
    userId: string,
    events: AuditEvent[]
  ): Promise<ThreatEvent | null> {
    const metrics = this.getBehaviorMetrics(userId);
    const unusualPatterns = this.detectUnusualPatterns(events, metrics);

    if (unusualPatterns.length > 0) {
      const threat: ThreatEvent = {
        id: this.generateThreatId(),
        type: ThreatType.ABNORMAL_BEHAVIOR,
        level: ThreatLevel.MEDIUM,
        status: ThreatStatus.ACTIVE,
        userId,
        timestamp: Date.now(),
        description: 'Abnormal user behavior patterns detected',
        metadata: {
          patterns: unusualPatterns,
          eventCounts: metrics.eventCounts
        },
        mitigationSteps: [
          'Monitor user activity',
          'Flag account for review',
          'Implement additional verification steps'
        ]
      };

      this.activeThreats.push(threat);
      return threat;
    }

    return null;
  }

  /**
   * Get active threats with optional filters
   */
  public async getThreats(filters: {
    userId?: string;
    groupId?: string;
    type?: ThreatType;
    level?: ThreatLevel;
    status?: ThreatStatus;
  }): Promise<ThreatEvent[]> {
    return this.activeThreats.filter(threat => {
      if (filters.userId && threat.userId !== filters.userId) return false;
      if (filters.groupId && threat.groupId !== filters.groupId) return false;
      if (filters.type && threat.type !== filters.type) return false;
      if (filters.level && threat.level !== filters.level) return false;
      if (filters.status && threat.status !== filters.status) return false;
      return true;
    });
  }

  /**
   * Get all active threats
   */
  public async getActiveThreats(): Promise<ThreatEvent[]> {
    return this.activeThreats.filter(threat => threat.status === ThreatStatus.ACTIVE);
  }

  private getLoginMetrics(userId: string): LoginAttemptMetrics {
    if (!this.loginMetrics.has(userId)) {
      this.loginMetrics.set(userId, {
        failedAttempts: 0,
        lastAttemptTime: 0,
        ipAddress: '',
        userAgent: ''
      });
    }
    return this.loginMetrics.get(userId)!;
  }

  private getKeyRotationMetrics(groupId: string): KeyRotationMetrics {
    if (!this.keyRotationMetrics.has(groupId)) {
      this.keyRotationMetrics.set(groupId, {
        rotationCount: 0,
        lastRotationTime: 0,
        initiatorIds: []
      });
    }
    return this.keyRotationMetrics.get(groupId)!;
  }

  private getBehaviorMetrics(userId: string): BehaviorMetrics {
    if (!this.behaviorMetrics.has(userId)) {
      this.behaviorMetrics.set(userId, {
        eventCounts: {} as Record<AuditEventType, number>,
        lastEventTime: 0,
        unusualPatterns: []
      });
    }
    return this.behaviorMetrics.get(userId)!;
  }

  private isSuspiciousLogin(metrics: LoginAttemptMetrics): boolean {
    // Implement suspicious login detection logic
    // This could include checking for:
    // - Login from new IP address
    // - Login from unusual location
    // - Login at unusual time
    // - Multiple failed attempts followed by success
    return metrics.failedAttempts > 0;
  }

  private isRapidKeyRotation(metrics: KeyRotationMetrics): boolean {
    const now = Date.now();
    return (
      metrics.rotationCount >= this.MAX_KEY_ROTATIONS &&
      now - metrics.lastRotationTime <= this.KEY_ROTATION_WINDOW
    );
  }

  private detectUnusualPatterns(
    events: AuditEvent[],
    metrics: BehaviorMetrics
  ): string[] {
    const patterns: string[] = [];
    const now = Date.now();

    // Update event counts
    events.forEach(event => {
      metrics.eventCounts[event.type] = (metrics.eventCounts[event.type] || 0) + 1;
    });

    // Check for unusual patterns
    // This is a simplified implementation - in practice, you'd want more sophisticated
    // pattern detection algorithms
    Object.entries(metrics.eventCounts).forEach(([type, count]) => {
      if (count > 100) {
        patterns.push(`High frequency of ${type} events`);
      }
    });

    return patterns;
  }

  private generateThreatId(): string {
    return `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default ThreatDetectionService.getInstance();
