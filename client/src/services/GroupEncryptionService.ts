import { webcrypto } from 'crypto';
import { GroupKeys, GroupMember, EncryptedMessage } from '../types/group';

class GroupEncryptionService {
  private crypto: typeof webcrypto;

  constructor() {
    this.crypto = window.crypto;
  }

  /**
   * Generates a new group key pair for secure group communication
   */
  async generateGroupKeyPair(): Promise<GroupKeys> {
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
   * Derives a shared group key for all members
   */
  async deriveGroupKey(privateKey: JsonWebKey, publicKey: JsonWebKey): Promise<CryptoKey> {
    const importedPrivateKey = await this.crypto.subtle.importKey(
      'jwk',
      privateKey,
      {
        name: 'ECDH',
        namedCurve: 'P-384'
      },
      true,
      ['deriveKey', 'deriveBits']
    );

    const importedPublicKey = await this.crypto.subtle.importKey(
      'jwk',
      publicKey,
      {
        name: 'ECDH',
        namedCurve: 'P-384'
      },
      true,
      ['deriveKey', 'deriveBits']
    );

    return await this.crypto.subtle.deriveKey(
      {
        name: 'ECDH',
        public: importedPublicKey
      },
      importedPrivateKey,
      {
        name: 'AES-GCM',
        length: 256
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypts a message for a group using the shared group key
   */
  async encryptGroupMessage(message: string, groupKey: CryptoKey): Promise<EncryptedMessage> {
    const iv = this.crypto.getRandomValues(new Uint8Array(12));
    const encodedMessage = new TextEncoder().encode(message);

    const encryptedData = await this.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      groupKey,
      encodedMessage
    );

    return {
      encryptedData: Array.from(new Uint8Array(encryptedData)),
      iv: Array.from(iv)
    };
  }

  /**
   * Decrypts a group message using the shared group key
   */
  async decryptGroupMessage(encryptedMessage: EncryptedMessage, groupKey: CryptoKey): Promise<string> {
    const decryptedData = await this.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(encryptedMessage.iv)
      },
      groupKey,
      new Uint8Array(encryptedMessage.encryptedData)
    );

    return new TextDecoder().decode(decryptedData);
  }

  /**
   * Rotates group keys periodically for enhanced security
   */
  async rotateGroupKeys(members: GroupMember[]): Promise<GroupKeys> {
    const newKeys = await this.generateGroupKeyPair();
    
    // Distribute new keys to all group members
    for (const member of members) {
      await this.distributeNewKeys(member, newKeys);
    }

    return newKeys;
  }

  /**
   * Distributes new keys to a group member securely
   */
  private async distributeNewKeys(member: GroupMember, newKeys: GroupKeys): Promise<void> {
    // Encrypt new keys with member's public key
    const memberPublicKey = await this.crypto.subtle.importKey(
      'jwk',
      member.publicKey,
      {
        name: 'ECDH',
        namedCurve: 'P-384'
      },
      true,
      []
    );

    // Implementation of secure key distribution
    // This would typically involve encrypting the new keys with each member's public key
    // and sending them through a secure channel
  }
}

export default new GroupEncryptionService();
