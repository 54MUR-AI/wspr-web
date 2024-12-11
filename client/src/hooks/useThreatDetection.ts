import { useState, useCallback, useEffect } from 'react';
import ThreatDetectionService, {
  ThreatEvent,
  ThreatType,
  ThreatLevel,
  ThreatStatus
} from '../services/ThreatDetectionService';
import { GroupMember } from '../types/group';
import { AuditEvent } from '../services/AuditService';

interface UseThreatDetectionProps {
  userId: string;
  groupId?: string;
  onThreatDetected?: (threat: ThreatEvent) => void;
  onCriticalThreat?: (threat: ThreatEvent) => void;
}

interface ThreatDetectionState {
  activeThreats: ThreatEvent[];
  loading: boolean;
  error: Error | null;
}

export const useThreatDetection = ({
  userId,
  groupId,
  onThreatDetected,
  onCriticalThreat
}: UseThreatDetectionProps) => {
  const [state, setState] = useState<ThreatDetectionState>({
    activeThreats: [],
    loading: false,
    error: null
  });

  // Load active threats on mount
  useEffect(() => {
    const loadActiveThreats = async () => {
      setState(prev => ({ ...prev, loading: true }));
      try {
        const threats = await ThreatDetectionService.getActiveThreats();
        setState(prev => ({
          ...prev,
          loading: false,
          activeThreats: threats
        }));
      } catch (err) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err : new Error('Failed to load threats')
        }));
      }
    };

    loadActiveThreats();
  }, []);

  /**
   * Analyze login attempt for threats
   */
  const analyzeLoginAttempt = useCallback(
    async (success: boolean, metadata: Record<string, any>) => {
      try {
        const threat = await ThreatDetectionService.analyzeLoginAttempt(
          userId,
          success,
          metadata
        );

        if (threat) {
          setState(prev => ({
            ...prev,
            activeThreats: [...prev.activeThreats, threat]
          }));

          onThreatDetected?.(threat);
          if (threat.level === ThreatLevel.CRITICAL) {
            onCriticalThreat?.(threat);
          }
        }

        return threat;
      } catch (err) {
        setState(prev => ({
          ...prev,
          error: err instanceof Error ? err : new Error('Failed to analyze login attempt')
        }));
        throw err;
      }
    },
    [userId, onThreatDetected, onCriticalThreat]
  );

  /**
   * Analyze key rotation for threats
   */
  const analyzeKeyRotation = useCallback(
    async (initiator: GroupMember) => {
      if (!groupId) {
        throw new Error('Group ID is required for key rotation analysis');
      }

      try {
        const threat = await ThreatDetectionService.analyzeKeyRotation(
          groupId,
          initiator
        );

        if (threat) {
          setState(prev => ({
            ...prev,
            activeThreats: [...prev.activeThreats, threat]
          }));

          onThreatDetected?.(threat);
          if (threat.level === ThreatLevel.CRITICAL) {
            onCriticalThreat?.(threat);
          }
        }

        return threat;
      } catch (err) {
        setState(prev => ({
          ...prev,
          error: err instanceof Error ? err : new Error('Failed to analyze key rotation')
        }));
        throw err;
      }
    },
    [groupId, onThreatDetected, onCriticalThreat]
  );

  /**
   * Analyze encryption failure
   */
  const analyzeEncryptionFailure = useCallback(
    async (error: Error) => {
      if (!groupId) {
        throw new Error('Group ID is required for encryption failure analysis');
      }

      try {
        const threat = await ThreatDetectionService.analyzeEncryptionFailure(
          userId,
          groupId,
          error
        );

        if (threat) {
          setState(prev => ({
            ...prev,
            activeThreats: [...prev.activeThreats, threat]
          }));

          onThreatDetected?.(threat);
          if (threat.level === ThreatLevel.CRITICAL) {
            onCriticalThreat?.(threat);
          }
        }

        return threat;
      } catch (err) {
        setState(prev => ({
          ...prev,
          error: err instanceof Error ? err : new Error('Failed to analyze encryption failure')
        }));
        throw err;
      }
    },
    [userId, groupId, onThreatDetected, onCriticalThreat]
  );

  /**
   * Analyze user behavior
   */
  const analyzeUserBehavior = useCallback(
    async (events: AuditEvent[]) => {
      try {
        const threat = await ThreatDetectionService.analyzeUserBehavior(userId, events);

        if (threat) {
          setState(prev => ({
            ...prev,
            activeThreats: [...prev.activeThreats, threat]
          }));

          onThreatDetected?.(threat);
          if (threat.level === ThreatLevel.CRITICAL) {
            onCriticalThreat?.(threat);
          }
        }

        return threat;
      } catch (err) {
        setState(prev => ({
          ...prev,
          error: err instanceof Error ? err : new Error('Failed to analyze user behavior')
        }));
        throw err;
      }
    },
    [userId, onThreatDetected, onCriticalThreat]
  );

  /**
   * Query threats with filters
   */
  const queryThreats = useCallback(
    async (filters: {
      type?: ThreatType;
      level?: ThreatLevel;
      status?: ThreatStatus;
    }) => {
      setState(prev => ({ ...prev, loading: true }));

      try {
        const threats = await ThreatDetectionService.getThreats({
          ...filters,
          userId,
          groupId
        });

        setState(prev => ({
          ...prev,
          loading: false,
          activeThreats: threats
        }));

        return threats;
      } catch (err) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err : new Error('Failed to query threats')
        }));
        throw err;
      }
    },
    [userId, groupId]
  );

  return {
    ...state,
    analyzeLoginAttempt,
    analyzeKeyRotation,
    analyzeEncryptionFailure,
    analyzeUserBehavior,
    queryThreats
  };
};
