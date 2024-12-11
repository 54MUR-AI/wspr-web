import axios from 'axios';

class RecoveryKeyService {
  private static instance: RecoveryKeyService;
  private baseUrl: string = '/api/auth/recovery-key';

  private constructor() {}

  public static getInstance(): RecoveryKeyService {
    if (!RecoveryKeyService.instance) {
      RecoveryKeyService.instance = new RecoveryKeyService();
    }
    return RecoveryKeyService.instance;
  }

  async generateKey(): Promise<{ recoveryKey: string }> {
    try {
      const response = await axios.post(`${this.baseUrl}/generate`);
      return {
        recoveryKey: response.data.recoveryKey
      };
    } catch (error) {
      console.error('Recovery key generation failed:', error);
      throw error;
    }
  }

  async verifyKey(recoveryKey: string): Promise<{ token: string }> {
    try {
      const response = await axios.post(`${this.baseUrl}/verify`, {
        recoveryKey
      });
      return {
        token: response.data.token
      };
    } catch (error) {
      console.error('Recovery key verification failed:', error);
      throw error;
    }
  }

  async invalidateKey(): Promise<boolean> {
    try {
      const response = await axios.post(`${this.baseUrl}/invalidate`);
      return response.data.success;
    } catch (error) {
      console.error('Recovery key invalidation failed:', error);
      throw error;
    }
  }

  // Helper method to format recovery key for display
  formatRecoveryKey(key: string): string {
    return key.match(/.{1,4}/g)?.join('-') || key;
  }

  // Helper method to clean user input
  cleanRecoveryKey(key: string): string {
    return key.replace(/[^A-Z0-9]/gi, '');
  }
}

export default RecoveryKeyService;
