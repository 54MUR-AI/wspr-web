import { WebAuthnCredential } from '../types/webauthn';

const STORAGE_KEY = 'wspr_webauthn_credentials';
const CREDENTIAL_VERSION = '1.0';

interface StoredCredential extends WebAuthnCredential {
  version: string;
  lastUsed: string;
  deviceName?: string;
}

export class WebAuthnStorageService {
  private static instance: WebAuthnStorageService;

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  public static getInstance(): WebAuthnStorageService {
    if (!WebAuthnStorageService.instance) {
      WebAuthnStorageService.instance = new WebAuthnStorageService();
    }
    return WebAuthnStorageService.instance;
  }

  /**
   * Store a new WebAuthn credential
   */
  public async storeCredential(
    credential: WebAuthnCredential,
    deviceName?: string
  ): Promise<void> {
    const credentials = await this.getAllCredentials();
    
    const storedCredential: StoredCredential = {
      ...credential,
      version: CREDENTIAL_VERSION,
      lastUsed: new Date().toISOString(),
      deviceName
    };

    // Check if credential already exists
    const existingIndex = credentials.findIndex(
      c => c.credentialId === credential.credentialId
    );

    if (existingIndex >= 0) {
      credentials[existingIndex] = storedCredential;
    } else {
      credentials.push(storedCredential);
    }

    await this.saveCredentials(credentials);
  }

  /**
   * Retrieve a specific credential by ID
   */
  public async getCredential(credentialId: string): Promise<StoredCredential | null> {
    const credentials = await this.getAllCredentials();
    return credentials.find(c => c.credentialId === credentialId) || null;
  }

  /**
   * Get all stored credentials
   */
  public async getAllCredentials(): Promise<StoredCredential[]> {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (!storedData) {
        return [];
      }

      const credentials: StoredCredential[] = JSON.parse(storedData);
      return credentials.filter(c => c.version === CREDENTIAL_VERSION);
    } catch (error) {
      console.error('Error reading WebAuthn credentials:', error);
      return [];
    }
  }

  /**
   * Update the last used timestamp for a credential
   */
  public async updateCredentialUsage(credentialId: string): Promise<void> {
    const credentials = await this.getAllCredentials();
    const credential = credentials.find(c => c.credentialId === credentialId);
    
    if (credential) {
      credential.lastUsed = new Date().toISOString();
      await this.saveCredentials(credentials);
    }
  }

  /**
   * Remove a specific credential
   */
  public async removeCredential(credentialId: string): Promise<void> {
    const credentials = await this.getAllCredentials();
    const filteredCredentials = credentials.filter(
      c => c.credentialId !== credentialId
    );
    await this.saveCredentials(filteredCredentials);
  }

  /**
   * Clear all stored credentials
   */
  public async clearAllCredentials(): Promise<void> {
    await this.saveCredentials([]);
  }

  /**
   * Update device name for a credential
   */
  public async updateDeviceName(
    credentialId: string,
    deviceName: string
  ): Promise<void> {
    const credentials = await this.getAllCredentials();
    const credential = credentials.find(c => c.credentialId === credentialId);
    
    if (credential) {
      credential.deviceName = deviceName;
      await this.saveCredentials(credentials);
    }
  }

  /**
   * Save credentials to storage
   */
  private async saveCredentials(credentials: StoredCredential[]): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
    } catch (error) {
      console.error('Error saving WebAuthn credentials:', error);
      throw new Error('Failed to save WebAuthn credentials');
    }
  }

  /**
   * Check if storage is available
   */
  public isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }
}
