import { Message } from '../types/message';

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const TAG_LENGTH = 128;

interface EncryptedData {
  ciphertext: ArrayBuffer;
  iv: Uint8Array;
}

export async function generateEncryptionKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function exportKey(key: CryptoKey): Promise<JsonWebKey> {
  return await window.crypto.subtle.exportKey('jwk', key);
}

export async function importKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return await window.crypto.subtle.importKey(
    'jwk',
    jwk,
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

async function encrypt(data: ArrayBuffer, key: CryptoKey): Promise<EncryptedData> {
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  
  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv,
      tagLength: TAG_LENGTH,
    },
    key,
    data
  );

  return {
    ciphertext,
    iv,
  };
}

async function decrypt(
  encryptedData: EncryptedData,
  key: CryptoKey
): Promise<ArrayBuffer> {
  return await window.crypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv: encryptedData.iv,
      tagLength: TAG_LENGTH,
    },
    key,
    encryptedData.ciphertext
  );
}

// Helper functions for converting between different formats
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return btoa(String.fromCharCode(...bytes));
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Message encryption/decryption
export async function encryptMessage(
  message: Message,
  recipientPublicKey?: JsonWebKey
): Promise<string> {
  try {
    // For development, use a temporary key. In production, use the recipient's public key
    const key = recipientPublicKey
      ? await importKey(recipientPublicKey)
      : await generateEncryptionKey();

    const messageString = JSON.stringify(message);
    const messageBuffer = new TextEncoder().encode(messageString);
    
    const { ciphertext, iv } = await encrypt(messageBuffer, key);
    
    const encryptedMessage = {
      ciphertext: arrayBufferToBase64(ciphertext),
      iv: arrayBufferToBase64(iv),
    };

    return JSON.stringify(encryptedMessage);
  } catch (error) {
    console.error('Message encryption error:', error);
    throw error;
  }
}

export async function decryptMessage(
  encryptedMessageString: string,
  privateKey?: CryptoKey
): Promise<Message> {
  try {
    // For development, use a temporary key. In production, use the user's private key
    const key = privateKey || await generateEncryptionKey();

    const { ciphertext, iv } = JSON.parse(encryptedMessageString);
    
    const decryptedBuffer = await decrypt(
      {
        ciphertext: base64ToArrayBuffer(ciphertext),
        iv: new Uint8Array(base64ToArrayBuffer(iv)),
      },
      key
    );

    const decryptedString = new TextDecoder().decode(decryptedBuffer);
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('Message decryption error:', error);
    throw error;
  }
}

// Key exchange functions
export async function generateKeyPair(): Promise<{
  publicKey: JsonWebKey;
  privateKey: CryptoKey;
}> {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    ['deriveKey']
  );

  const publicKeyJwk = await window.crypto.subtle.exportKey(
    'jwk',
    keyPair.publicKey
  );

  return {
    publicKey: publicKeyJwk,
    privateKey: keyPair.privateKey,
  };
}

export async function deriveSharedKey(
  privateKey: CryptoKey,
  publicKeyJwk: JsonWebKey
): Promise<CryptoKey> {
  const publicKey = await window.crypto.subtle.importKey(
    'jwk',
    publicKeyJwk,
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    []
  );

  const sharedSecret = await window.crypto.subtle.deriveKey(
    {
      name: 'ECDH',
      public: publicKey,
    },
    privateKey,
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true,
    ['encrypt', 'decrypt']
  );

  return sharedSecret;
}
