import { useState, useCallback, useEffect } from 'react';
import GroupEncryptionService from '../services/GroupEncryptionService';
import { GroupKeys, GroupMember, EncryptedMessage, GroupMessage } from '../types/group';

interface UseGroupEncryptionProps {
  groupId: string;
  currentMember: GroupMember;
  members: GroupMember[];
}

interface UseGroupEncryptionReturn {
  encryptMessage: (message: string) => Promise<EncryptedMessage>;
  decryptMessage: (message: GroupMessage) => Promise<string>;
  rotateKeys: () => Promise<void>;
  isKeyRotationNeeded: boolean;
  lastKeyRotation: Date | null;
  error: Error | null;
}

const KEY_ROTATION_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 days

export const useGroupEncryption = ({
  groupId,
  currentMember,
  members
}: UseGroupEncryptionProps): UseGroupEncryptionReturn => {
  const [groupKeys, setGroupKeys] = useState<GroupKeys | null>(null);
  const [groupKey, setGroupKey] = useState<CryptoKey | null>(null);
  const [lastKeyRotation, setLastKeyRotation] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Initialize group encryption
  useEffect(() => {
    const initializeGroupEncryption = async () => {
      try {
        // In a real implementation, we would fetch the existing group keys
        // or generate new ones if this is a new group
        const keys = await GroupEncryptionService.generateGroupKeyPair();
        setGroupKeys(keys);

        // Derive the shared group key
        const derivedKey = await GroupEncryptionService.deriveGroupKey(
          keys.privateKey,
          keys.publicKey
        );
        setGroupKey(derivedKey);

        setLastKeyRotation(new Date());
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize group encryption'));
      }
    };

    initializeGroupEncryption();
  }, [groupId]);

  // Check if key rotation is needed
  const isKeyRotationNeeded = useCallback(() => {
    if (!lastKeyRotation) return true;
    
    const timeSinceLastRotation = Date.now() - lastKeyRotation.getTime();
    return timeSinceLastRotation >= KEY_ROTATION_INTERVAL;
  }, [lastKeyRotation]);

  // Encrypt a message
  const encryptMessage = useCallback(
    async (message: string): Promise<EncryptedMessage> => {
      if (!groupKey) {
        throw new Error('Group key not initialized');
      }

      try {
        return await GroupEncryptionService.encryptGroupMessage(message, groupKey);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to encrypt message'));
        throw err;
      }
    },
    [groupKey]
  );

  // Decrypt a message
  const decryptMessage = useCallback(
    async (message: GroupMessage): Promise<string> => {
      if (!groupKey) {
        throw new Error('Group key not initialized');
      }

      try {
        return await GroupEncryptionService.decryptGroupMessage(
          message.encryptedContent,
          groupKey
        );
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to decrypt message'));
        throw err;
      }
    },
    [groupKey]
  );

  // Rotate group keys
  const rotateKeys = useCallback(async () => {
    try {
      const newKeys = await GroupEncryptionService.rotateGroupKeys(members);
      setGroupKeys(newKeys);

      // Derive new group key
      const newGroupKey = await GroupEncryptionService.deriveGroupKey(
        newKeys.privateKey,
        newKeys.publicKey
      );
      setGroupKey(newGroupKey);
      setLastKeyRotation(new Date());
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to rotate keys'));
      throw err;
    }
  }, [members]);

  return {
    encryptMessage,
    decryptMessage,
    rotateKeys,
    isKeyRotationNeeded: isKeyRotationNeeded(),
    lastKeyRotation,
    error
  };
};
