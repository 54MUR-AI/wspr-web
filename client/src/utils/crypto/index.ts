import { Buffer } from 'buffer';
import { TextEncoder, TextDecoder } from 'text-encoding';

// Constants for encryption
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Key derivation parameters
const KEY_DERIVATION_ALGORITHM = 'PBKDF2';
const KEY_DERIVATION_ITERATIONS = 100000;
const KEY_DERIVATION_HASH = 'SHA-256';

/**
 * Generate a random initialization vector
 */
export const generateIV = (): Uint8Array => {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
};

/**
 * Generate a random salt
 */
export const generateSalt = (): Uint8Array => {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
};

/**
 * Generate a key pair for asymmetric encryption
 */
export const generateKeyPair = async (): Promise<CryptoKeyPair> => {
  return await crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    ['deriveKey', 'deriveBits']
  );
};

/**
 * Export a public key to base64 string
 */
export const exportPublicKey = async (key: CryptoKey): Promise<string> => {
  const exported = await crypto.subtle.exportKey('spki', key);
  return Buffer.from(exported).toString('base64');
};

/**
 * Import a public key from base64 string
 */
export const importPublicKey = async (keyStr: string): Promise<CryptoKey> => {
  const keyData = Buffer.from(keyStr, 'base64');
  return await crypto.subtle.importKey(
    'spki',
    keyData,
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    []
  );
};

/**
 * Derive a shared secret using ECDH
 */
export const deriveSharedSecret = async (
  privateKey: CryptoKey,
  publicKey: CryptoKey
): Promise<CryptoKey> => {
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'ECDH',
      public: publicKey,
    },
    privateKey,
    KEY_LENGTH
  );

  return await crypto.subtle.importKey(
    'raw',
    derivedBits,
    {
      name: ALGORITHM,
    },
    false,
    ['encrypt', 'decrypt']
  );
};

/**
 * Generate an encryption key from a password
 */
export const deriveKeyFromPassword = async (
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    KEY_DERIVATION_ALGORITHM,
    false,
    ['deriveBits', 'deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: KEY_DERIVATION_ALGORITHM,
      salt,
      iterations: KEY_DERIVATION_ITERATIONS,
      hash: KEY_DERIVATION_HASH,
    },
    baseKey,
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true,
    ['encrypt', 'decrypt']
  );
};

/**
 * Encrypt data using AES-GCM
 */
export const encrypt = async (
  data: string,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> => {
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(data);
  const iv = generateIV();

  const encryptedData = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv,
    },
    key,
    encodedData
  );

  return {
    ciphertext: Buffer.from(encryptedData).toString('base64'),
    iv: Buffer.from(iv).toString('base64'),
  };
};

/**
 * Decrypt data using AES-GCM
 */
export const decrypt = async (
  ciphertext: string,
  iv: string,
  key: CryptoKey
): Promise<string> => {
  const decoder = new TextDecoder();
  const encryptedData = Buffer.from(ciphertext, 'base64');
  const ivData = Buffer.from(iv, 'base64');

  const decryptedData = await crypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv: ivData,
    },
    key,
    encryptedData
  );

  return decoder.decode(decryptedData);
};

/**
 * Generate a session key for symmetric encryption
 */
export const generateSessionKey = async (): Promise<CryptoKey> => {
  return await crypto.subtle.generateKey(
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true,
    ['encrypt', 'decrypt']
  );
};

/**
 * Export a session key to base64 string
 */
export const exportSessionKey = async (key: CryptoKey): Promise<string> => {
  const exported = await crypto.subtle.exportKey('raw', key);
  return Buffer.from(exported).toString('base64');
};

/**
 * Import a session key from base64 string
 */
export const importSessionKey = async (keyStr: string): Promise<CryptoKey> => {
  const keyData = Buffer.from(keyStr, 'base64');
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true,
    ['encrypt', 'decrypt']
  );
};
