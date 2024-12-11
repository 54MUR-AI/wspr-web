import { webcrypto } from 'crypto';
import { GroupKeys, GroupMember, GroupRole } from '../types/group';

interface RotationSchedule {
  groupId: string;
  lastRotation: Date;
  nextRotation: Date;
  version: number;
}

class KeyRotationService {
  private crypto: typeof webcrypto;
  private rotationSchedules: Map<string, RotationSchedule>;
  private readonly ROTATION_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor() {
    this.crypto = window.crypto;
    this.rotationSchedules = new Map();
  }

  /**
   * Initialize key rotation for a group
   */
  async initializeRotation(groupId: string): Promise<RotationSchedule> {
    const now = new Date();
    const schedule: RotationSchedule = {
      groupId,
      lastRotation: now,
      nextRotation: new Date(now.getTime() + this.ROTATION_INTERVAL),
      version: 1
    };
    
    this.rotationSchedules.set(groupId, schedule);
    return schedule;
  }

  /**
   * Generate new keys for rotation
   */
  async generateRotationKeys(): Promise<GroupKeys> {
    const keyPair = await this.crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-384'
      },
      true,
      ['deriveKey', 'deriveBits']
    );

    const publicKeyJwk = await this.crypto.subtle.exportKey('jwk', keyPair.publicKey);
    const privateKeyJwk = await this.crypto.subtle.exportKey('jwk', keyPair.privateKey);

    return {
      publicKey: publicKeyJwk,
      privateKey: privateKeyJwk
    };
  }

  /**
   * Create encrypted key bundles for each member
   */
  async createKeyBundles(
    newKeys: GroupKeys,
    members: GroupMember[]
  ): Promise<Map<string, ArrayBuffer>> {
    const bundles = new Map<string, ArrayBuffer>();

    for (const member of members) {
      const bundle = await this.createMemberKeyBundle(newKeys, member);
      bundles.set(member.id, bundle);
    }

    return bundles;
  }

  /**
   * Create an encrypted key bundle for a single member
   */
  private async createMemberKeyBundle(
    keys: GroupKeys,
    member: GroupMember
  ): Promise<ArrayBuffer> {
    // Import member's public key
    const memberKey = await this.crypto.subtle.importKey(
      'jwk',
      member.publicKey,
      {
        name: 'ECDH',
        namedCurve: 'P-384'
      },
      true,
      []
    );

    // Generate a unique encryption key for this bundle
    const bundleKey = await this.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true,
      ['encrypt', 'decrypt']
    );

    // Encrypt the new keys
    const iv = this.crypto.getRandomValues(new Uint8Array(12));
    const keyData = JSON.stringify(keys);
    const encodedKeys = new TextEncoder().encode(keyData);

    const encryptedKeys = await this.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      bundleKey,
      encodedKeys
    );

    // Combine IV and encrypted data
    const bundle = new Uint8Array(iv.length + encryptedKeys.byteLength);
    bundle.set(iv, 0);
    bundle.set(new Uint8Array(encryptedKeys), iv.length);

    return bundle.buffer;
  }

  /**
   * Check if key rotation is needed for a group
   */
  isRotationNeeded(groupId: string): boolean {
    const schedule = this.rotationSchedules.get(groupId);
    if (!schedule) return true;

    return Date.now() >= schedule.nextRotation.getTime();
  }

  /**
   * Update rotation schedule after successful rotation
   */
  updateRotationSchedule(groupId: string): RotationSchedule {
    const now = new Date();
    const currentSchedule = this.rotationSchedules.get(groupId);
    
    const newSchedule: RotationSchedule = {
      groupId,
      lastRotation: now,
      nextRotation: new Date(now.getTime() + this.ROTATION_INTERVAL),
      version: (currentSchedule?.version ?? 0) + 1
    };

    this.rotationSchedules.set(groupId, newSchedule);
    return newSchedule;
  }

  /**
   * Verify member has permission to initiate key rotation
   */
  canInitiateRotation(member: GroupMember): boolean {
    return [GroupRole.ADMIN, GroupRole.MODERATOR].includes(member.role);
  }

  /**
   * Get the current rotation schedule for a group
   */
  getRotationSchedule(groupId: string): RotationSchedule | undefined {
    return this.rotationSchedules.get(groupId);
  }

  /**
   * Emergency key rotation for security incidents
   */
  async initiateEmergencyRotation(
    groupId: string,
    initiator: GroupMember,
    members: GroupMember[]
  ): Promise<{
    keys: GroupKeys;
    bundles: Map<string, ArrayBuffer>;
    schedule: RotationSchedule;
  }> {
    if (!this.canInitiateRotation(initiator)) {
      throw new Error('Unauthorized to initiate emergency key rotation');
    }

    const newKeys = await this.generateRotationKeys();
    const bundles = await this.createKeyBundles(newKeys, members);
    const schedule = this.updateRotationSchedule(groupId);

    return {
      keys: newKeys,
      bundles,
      schedule
    };
  }
}

export default new KeyRotationService();
