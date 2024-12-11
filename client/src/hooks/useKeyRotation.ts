import { useState, useCallback, useEffect } from 'react';
import KeyRotationService from '../services/KeyRotationService';
import { GroupMember, GroupKeys } from '../types/group';

interface UseKeyRotationProps {
  groupId: string;
  currentMember: GroupMember;
  members: GroupMember[];
  onRotationComplete?: (newKeys: GroupKeys) => void;
  onRotationError?: (error: Error) => void;
}

interface RotationStatus {
  isRotating: boolean;
  lastRotation: Date | null;
  nextRotation: Date | null;
  version: number;
  error: Error | null;
}

export const useKeyRotation = ({
  groupId,
  currentMember,
  members,
  onRotationComplete,
  onRotationError
}: UseKeyRotationProps) => {
  const [status, setStatus] = useState<RotationStatus>({
    isRotating: false,
    lastRotation: null,
    nextRotation: null,
    version: 0,
    error: null
  });

  // Initialize rotation schedule
  useEffect(() => {
    const initializeSchedule = async () => {
      try {
        const schedule = await KeyRotationService.initializeRotation(groupId);
        setStatus(prev => ({
          ...prev,
          lastRotation: schedule.lastRotation,
          nextRotation: schedule.nextRotation,
          version: schedule.version
        }));
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to initialize key rotation');
        setStatus(prev => ({ ...prev, error }));
        onRotationError?.(error);
      }
    };

    initializeSchedule();
  }, [groupId, onRotationError]);

  // Check if rotation is needed
  const checkRotationNeeded = useCallback(() => {
    return KeyRotationService.isRotationNeeded(groupId);
  }, [groupId]);

  // Perform key rotation
  const rotateKeys = useCallback(async () => {
    if (!KeyRotationService.canInitiateRotation(currentMember)) {
      throw new Error('Unauthorized to initiate key rotation');
    }

    setStatus(prev => ({ ...prev, isRotating: true, error: null }));

    try {
      // Generate new keys and create encrypted bundles for all members
      const newKeys = await KeyRotationService.generateRotationKeys();
      const bundles = await KeyRotationService.createKeyBundles(newKeys, members);
      const schedule = KeyRotationService.updateRotationSchedule(groupId);

      // Update status with new rotation schedule
      setStatus(prev => ({
        ...prev,
        isRotating: false,
        lastRotation: schedule.lastRotation,
        nextRotation: schedule.nextRotation,
        version: schedule.version
      }));

      onRotationComplete?.(newKeys);
      return { newKeys, bundles };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to rotate keys');
      setStatus(prev => ({ ...prev, isRotating: false, error }));
      onRotationError?.(error);
      throw error;
    }
  }, [groupId, currentMember, members, onRotationComplete, onRotationError]);

  // Emergency key rotation
  const emergencyRotation = useCallback(async () => {
    setStatus(prev => ({ ...prev, isRotating: true, error: null }));

    try {
      const { keys, bundles, schedule } = await KeyRotationService.initiateEmergencyRotation(
        groupId,
        currentMember,
        members
      );

      setStatus(prev => ({
        ...prev,
        isRotating: false,
        lastRotation: schedule.lastRotation,
        nextRotation: schedule.nextRotation,
        version: schedule.version
      }));

      onRotationComplete?.(keys);
      return { keys, bundles };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to perform emergency rotation');
      setStatus(prev => ({ ...prev, isRotating: false, error }));
      onRotationError?.(error);
      throw error;
    }
  }, [groupId, currentMember, members, onRotationComplete, onRotationError]);

  // Get current rotation schedule
  const getSchedule = useCallback(() => {
    return KeyRotationService.getRotationSchedule(groupId);
  }, [groupId]);

  return {
    status,
    rotateKeys,
    emergencyRotation,
    checkRotationNeeded,
    getSchedule
  };
};
