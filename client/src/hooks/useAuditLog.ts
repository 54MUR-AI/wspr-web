import { useCallback, useState } from 'react';
import AuditService, {
  AuditEvent,
  AuditEventType,
  AuditSeverity,
  AuditStatus
} from '../services/AuditService';

interface UseAuditLogProps {
  userId: string;
  groupId?: string;
  onCriticalEvent?: (event: AuditEvent) => void;
}

interface AuditLogState {
  recentEvents: AuditEvent[];
  loading: boolean;
  error: Error | null;
}

export const useAuditLog = ({
  userId,
  groupId,
  onCriticalEvent
}: UseAuditLogProps) => {
  const [state, setState] = useState<AuditLogState>({
    recentEvents: [],
    loading: false,
    error: null
  });

  /**
   * Log a security-related event
   */
  const logSecurityEvent = useCallback(
    async (
      type: AuditEventType,
      details: Record<string, any>,
      severity: AuditSeverity = AuditSeverity.INFO
    ) => {
      try {
        const event = await AuditService.logSecurityEvent(
          type,
          userId,
          details,
          severity
        );

        if (severity === AuditSeverity.CRITICAL) {
          onCriticalEvent?.(event);
        }

        setState(prev => ({
          ...prev,
          recentEvents: [event, ...prev.recentEvents].slice(0, 100)
        }));

        return event;
      } catch (err) {
        setState(prev => ({
          ...prev,
          error: err instanceof Error ? err : new Error('Failed to log security event')
        }));
        throw err;
      }
    },
    [userId, onCriticalEvent]
  );

  /**
   * Log a key rotation event
   */
  const logKeyRotation = useCallback(
    async (success: boolean, metadata: Record<string, any> = {}) => {
      if (!groupId) {
        throw new Error('Group ID is required for key rotation logging');
      }

      try {
        const event = await AuditService.logKeyRotation(
          userId,
          groupId,
          success,
          metadata
        );

        setState(prev => ({
          ...prev,
          recentEvents: [event, ...prev.recentEvents].slice(0, 100)
        }));

        return event;
      } catch (err) {
        setState(prev => ({
          ...prev,
          error: err instanceof Error ? err : new Error('Failed to log key rotation')
        }));
        throw err;
      }
    },
    [userId, groupId]
  );

  /**
   * Log an emergency key rotation
   */
  const logEmergencyRotation = useCallback(
    async (reason: string) => {
      if (!groupId) {
        throw new Error('Group ID is required for emergency rotation logging');
      }

      try {
        const event = await AuditService.logEmergencyRotation(
          userId,
          groupId,
          reason
        );

        setState(prev => ({
          ...prev,
          recentEvents: [event, ...prev.recentEvents].slice(0, 100)
        }));

        onCriticalEvent?.(event);
        return event;
      } catch (err) {
        setState(prev => ({
          ...prev,
          error: err instanceof Error ? err : new Error('Failed to log emergency rotation')
        }));
        throw err;
      }
    },
    [userId, groupId, onCriticalEvent]
  );

  /**
   * Query audit events with filters
   */
  const queryEvents = useCallback(
    async (filters: {
      type?: AuditEventType;
      severity?: AuditSeverity;
      startDate?: Date;
      endDate?: Date;
      status?: AuditStatus;
    }) => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const events = await AuditService.queryEvents({
          ...filters,
          userId,
          groupId
        });

        setState(prev => ({
          ...prev,
          loading: false,
          recentEvents: events
        }));

        return events;
      } catch (err) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err : new Error('Failed to query events')
        }));
        throw err;
      }
    },
    [userId, groupId]
  );

  /**
   * Get security events for the current context
   */
  const getSecurityEvents = useCallback(
    async (severity?: AuditSeverity, startDate?: Date) => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const events = await AuditService.getSecurityEvents(severity, startDate);
        
        setState(prev => ({
          ...prev,
          loading: false,
          recentEvents: events
        }));

        return events;
      } catch (err) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err : new Error('Failed to get security events')
        }));
        throw err;
      }
    },
    []
  );

  return {
    ...state,
    logSecurityEvent,
    logKeyRotation,
    logEmergencyRotation,
    queryEvents,
    getSecurityEvents
  };
};
