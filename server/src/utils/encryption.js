const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.METRIC_ENCRYPTION_KEY || crypto.randomBytes(32);
const IV_LENGTH = 16;

/**
 * Encrypt metric data
 * @param {Object|Array} data Data to encrypt
 * @returns {Object} Encrypted data with IV
 */
function encryptMetricData(data) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  
  const jsonData = JSON.stringify(data);
  const encrypted = Buffer.concat([
    cipher.update(jsonData, 'utf8'),
    cipher.final()
  ]);
  
  const authTag = cipher.getAuthTag();
  
  return {
    iv: iv.toString('hex'),
    data: encrypted.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

/**
 * Decrypt metric data
 * @param {Object} encryptedData Encrypted data object with IV and auth tag
 * @returns {Object|Array} Decrypted data
 */
function decryptMetricData(encryptedData) {
  const iv = Buffer.from(encryptedData.iv, 'hex');
  const authTag = Buffer.from(encryptedData.authTag, 'hex');
  const encryptedBuffer = Buffer.from(encryptedData.data, 'hex');
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  
  const decrypted = Buffer.concat([
    decipher.update(encryptedBuffer),
    decipher.final()
  ]);
  
  return JSON.parse(decrypted.toString('utf8'));
}

/**
 * Generate a new encryption key
 * @returns {string} Hex string of the new key
 */
function generateNewKey() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Rotate encryption key
 * @param {string} newKey New encryption key
 * @param {Array} data Array of data to re-encrypt
 * @returns {Array} Re-encrypted data
 */
async function rotateEncryptionKey(newKey, data) {
  const oldKey = ENCRYPTION_KEY;
  ENCRYPTION_KEY = Buffer.from(newKey, 'hex');
  
  // Re-encrypt all data with new key
  const reEncryptedData = data.map(item => {
    const decrypted = decryptMetricData(item, oldKey);
    return encryptMetricData(decrypted, ENCRYPTION_KEY);
  });
  
  return reEncryptedData;
}

module.exports = {
  encryptMetricData,
  decryptMetricData,
  generateNewKey,
  rotateEncryptionKey
};
