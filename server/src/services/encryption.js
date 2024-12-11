const crypto = require('crypto');
const { promisify } = require('util');
const { createCipheriv, createDecipheriv, randomBytes, scrypt } = crypto;
const scryptAsync = promisify(scrypt);

class EncryptionService {
  static async generateKey(password, salt) {
    return await scryptAsync(password, salt, 32);
  }

  static async encryptFile(buffer, recipientPublicKey) {
    try {
      // Generate a random symmetric key for file encryption
      const fileKey = randomBytes(32);
      const iv = randomBytes(16);

      // Encrypt the file with the symmetric key
      const cipher = createCipheriv('aes-256-gcm', fileKey, iv);
      const encryptedFile = Buffer.concat([
        cipher.update(buffer),
        cipher.final()
      ]);
      const authTag = cipher.getAuthTag();

      // Encrypt the symmetric key with recipient's public key
      const encryptedKey = crypto.publicEncrypt(
        {
          key: recipientPublicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256'
        },
        fileKey
      );

      // Combine all components for storage/transmission
      return {
        encryptedFile,
        encryptedKey: encryptedKey.toString('base64'),
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64')
      };
    } catch (error) {
      console.error('File encryption failed:', error);
      throw new Error('File encryption failed');
    }
  }

  static async decryptFile(encryptedData, privateKey) {
    try {
      // Decrypt the symmetric key using private key
      const fileKey = crypto.privateDecrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256'
        },
        Buffer.from(encryptedData.encryptedKey, 'base64')
      );

      // Decrypt the file using the symmetric key
      const decipher = createDecipheriv(
        'aes-256-gcm',
        fileKey,
        Buffer.from(encryptedData.iv, 'base64')
      );
      
      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'base64'));

      const decryptedFile = Buffer.concat([
        decipher.update(encryptedData.encryptedFile),
        decipher.final()
      ]);

      return decryptedFile;
    } catch (error) {
      console.error('File decryption failed:', error);
      throw new Error('File decryption failed');
    }
  }

  static async encryptMetadata(metadata, recipientPublicKey) {
    try {
      const metadataString = JSON.stringify(metadata);
      const encryptedMetadata = crypto.publicEncrypt(
        {
          key: recipientPublicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256'
        },
        Buffer.from(metadataString)
      );

      return encryptedMetadata.toString('base64');
    } catch (error) {
      console.error('Metadata encryption failed:', error);
      throw new Error('Metadata encryption failed');
    }
  }

  static async decryptMetadata(encryptedMetadata, privateKey) {
    try {
      const decryptedMetadata = crypto.privateDecrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256'
        },
        Buffer.from(encryptedMetadata, 'base64')
      );

      return JSON.parse(decryptedMetadata.toString());
    } catch (error) {
      console.error('Metadata decryption failed:', error);
      throw new Error('Metadata decryption failed');
    }
  }

  static generateFileKey() {
    return randomBytes(32);
  }

  static async hashFile(buffer) {
    return crypto
      .createHash('sha256')
      .update(buffer)
      .digest('hex');
  }
}

module.exports = EncryptionService;
