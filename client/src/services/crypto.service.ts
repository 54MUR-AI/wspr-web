import {
  generateKeyPair,
  exportPublicKey,
  importPublicKey,
  deriveSharedSecret,
  encrypt,
  decrypt,
  generateSessionKey,
  exportSessionKey,
  importSessionKey,
} from '../utils/crypto';

export interface EncryptedMessage {
  ciphertext: string;
  iv: string;
}

export interface KeyExchangeData {
  publicKey: string;
  sessionKey: string;
}

class CryptoService {
  private keyPair: CryptoKeyPair | null = null;
  private sessionKeys: Map<string, CryptoKey> = new Map();

  /**
   * Initialize the crypto service by generating a key pair
   */
  async initialize(): Promise<string> {
    this.keyPair = await generateKeyPair();
    return await exportPublicKey(this.keyPair.publicKey);
  }

  /**
   * Start a secure session with another user
   * @param recipientId The ID of the recipient
   * @param recipientPublicKey The recipient's public key
   */
  async startSecureSession(
    recipientId: string,
    recipientPublicKey: string
  ): Promise<KeyExchangeData> {
    if (!this.keyPair) {
      throw new Error('Crypto service not initialized');
    }

    // Import the recipient's public key
    const publicKey = await importPublicKey(recipientPublicKey);

    // Derive a shared secret using ECDH
    const sharedSecret = await deriveSharedSecret(this.keyPair.privateKey, publicKey);

    // Generate a session key
    const sessionKey = await generateSessionKey();
    this.sessionKeys.set(recipientId, sessionKey);

    // Encrypt the session key with the shared secret
    const encryptedSessionKey = await encrypt(
      await exportSessionKey(sessionKey),
      sharedSecret
    );

    return {
      publicKey: await exportPublicKey(this.keyPair.publicKey),
      sessionKey: JSON.stringify(encryptedSessionKey),
    };
  }

  /**
   * Complete a secure session initiated by another user
   * @param senderId The ID of the sender
   * @param senderPublicKey The sender's public key
   * @param encryptedSessionKey The encrypted session key
   */
  async completeSecureSession(
    senderId: string,
    senderPublicKey: string,
    encryptedSessionKey: string
  ): Promise<string> {
    if (!this.keyPair) {
      throw new Error('Crypto service not initialized');
    }

    // Import the sender's public key
    const publicKey = await importPublicKey(senderPublicKey);

    // Derive the shared secret
    const sharedSecret = await deriveSharedSecret(this.keyPair.privateKey, publicKey);

    // Decrypt the session key
    const { ciphertext, iv } = JSON.parse(encryptedSessionKey);
    const sessionKeyStr = await decrypt(ciphertext, iv, sharedSecret);
    const sessionKey = await importSessionKey(sessionKeyStr);

    // Store the session key
    this.sessionKeys.set(senderId, sessionKey);

    // Return our public key
    return await exportPublicKey(this.keyPair.publicKey);
  }

  /**
   * Encrypt a message for a specific recipient
   * @param recipientId The ID of the recipient
   * @param message The message to encrypt
   */
  async encryptMessage(recipientId: string, message: string): Promise<EncryptedMessage> {
    const sessionKey = this.sessionKeys.get(recipientId);
    if (!sessionKey) {
      throw new Error('No secure session established with recipient');
    }

    return await encrypt(message, sessionKey);
  }

  /**
   * Decrypt a message from a specific sender
   * @param senderId The ID of the sender
   * @param encryptedMessage The encrypted message
   */
  async decryptMessage(
    senderId: string,
    encryptedMessage: EncryptedMessage
  ): Promise<string> {
    const sessionKey = this.sessionKeys.get(senderId);
    if (!sessionKey) {
      throw new Error('No secure session established with sender');
    }

    return await decrypt(encryptedMessage.ciphertext, encryptedMessage.iv, sessionKey);
  }

  /**
   * End a secure session with another user
   * @param userId The ID of the user
   */
  endSecureSession(userId: string): void {
    this.sessionKeys.delete(userId);
  }

  /**
   * Check if a secure session exists with a user
   * @param userId The ID of the user
   */
  hasSecureSession(userId: string): boolean {
    return this.sessionKeys.has(userId);
  }

  /**
   * Clear all secure sessions
   */
  clearSessions(): void {
    this.sessionKeys.clear();
  }
}

export const cryptoService = new CryptoService();
export default cryptoService;
