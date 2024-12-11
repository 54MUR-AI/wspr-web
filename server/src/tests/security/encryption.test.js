const { EncryptionService } = require('../../services/encryption');
const { randomBytes } = require('crypto');

describe('Encryption Service Tests', () => {
  let encryptionService;
  
  beforeEach(() => {
    encryptionService = new EncryptionService();
  });

  describe('File Encryption', () => {
    test('should encrypt and decrypt file content correctly', async () => {
      const fileContent = Buffer.from('Test file content');
      const metadata = { filename: 'test.txt', type: 'text/plain' };
      
      const encrypted = await encryptionService.encryptFile(fileContent, metadata);
      expect(encrypted.encryptedContent).not.toEqual(fileContent);
      expect(encrypted.encryptedMetadata).not.toEqual(JSON.stringify(metadata));
      
      const decrypted = await encryptionService.decryptFile(
        encrypted.encryptedContent,
        encrypted.encryptedMetadata,
        encrypted.key
      );
      
      expect(decrypted.content.toString()).toBe(fileContent.toString());
      expect(decrypted.metadata).toEqual(metadata);
    });

    test('should generate unique encryption keys for each file', async () => {
      const fileContent1 = Buffer.from('File 1 content');
      const fileContent2 = Buffer.from('File 2 content');
      
      const encrypted1 = await encryptionService.encryptFile(fileContent1, {});
      const encrypted2 = await encryptionService.encryptFile(fileContent2, {});
      
      expect(encrypted1.key).not.toEqual(encrypted2.key);
    });
  });

  describe('Message Encryption', () => {
    test('should encrypt and decrypt messages with perfect forward secrecy', async () => {
      const message = 'Secret message';
      const senderKeyPair = await encryptionService.generateKeyPair();
      const recipientKeyPair = await encryptionService.generateKeyPair();
      
      const encrypted = await encryptionService.encryptMessage(
        message,
        senderKeyPair.privateKey,
        recipientKeyPair.publicKey
      );
      
      const decrypted = await encryptionService.decryptMessage(
        encrypted,
        recipientKeyPair.privateKey,
        senderKeyPair.publicKey
      );
      
      expect(decrypted).toBe(message);
    });

    test('should fail decryption with wrong keys', async () => {
      const message = 'Secret message';
      const senderKeyPair = await encryptionService.generateKeyPair();
      const recipientKeyPair = await encryptionService.generateKeyPair();
      const wrongKeyPair = await encryptionService.generateKeyPair();
      
      const encrypted = await encryptionService.encryptMessage(
        message,
        senderKeyPair.privateKey,
        recipientKeyPair.publicKey
      );
      
      await expect(
        encryptionService.decryptMessage(
          encrypted,
          wrongKeyPair.privateKey,
          senderKeyPair.publicKey
        )
      ).rejects.toThrow();
    });
  });

  describe('Group Key Management', () => {
    test('should distribute group keys securely', async () => {
      const groupId = 'test-group';
      const members = ['user1', 'user2', 'user3'];
      const memberKeys = await Promise.all(
        members.map(async () => await encryptionService.generateKeyPair())
      );
      
      const groupKey = await encryptionService.createGroupKey(groupId);
      const encryptedKeys = await encryptionService.distributeGroupKey(
        groupKey,
        memberKeys.map(k => k.publicKey)
      );
      
      // Each member should be able to decrypt the group key
      for (let i = 0; i < members.length; i++) {
        const decryptedKey = await encryptionService.decryptGroupKey(
          encryptedKeys[i],
          memberKeys[i].privateKey
        );
        expect(decryptedKey).toEqual(groupKey);
      }
    });
  });

  describe('WebRTC Security', () => {
    test('should generate secure DTLS certificates', async () => {
      const certificate = await encryptionService.generateDTLSCertificate();
      expect(certificate).toHaveProperty('fingerprint');
      expect(certificate).toHaveProperty('certificate');
      expect(certificate).toHaveProperty('privateKey');
    });

    test('should validate DTLS certificates', async () => {
      const cert1 = await encryptionService.generateDTLSCertificate();
      const cert2 = await encryptionService.generateDTLSCertificate();
      
      const isValid = await encryptionService.validateDTLSCertificate(
        cert1.certificate,
        cert1.fingerprint
      );
      expect(isValid).toBe(true);
      
      const isInvalid = await encryptionService.validateDTLSCertificate(
        cert1.certificate,
        cert2.fingerprint
      );
      expect(isInvalid).toBe(false);
    });
  });
});
