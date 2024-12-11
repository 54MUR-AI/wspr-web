import { encryptMessage, decryptMessage } from '../utils/crypto';

export interface PrivacySettings {
  messageRetention: number; // in days, 0 means forever
  readReceipts: boolean;
  onlineStatus: 'everyone' | 'contacts' | 'nobody';
  lastSeen: 'everyone' | 'contacts' | 'nobody';
  typingIndicators: boolean;
  mediaAutoDownload: boolean;
  twoFactorAuth: boolean;
  backupEnabled: boolean;
  deviceLimit: number;
}

export interface DeviceInfo {
  id: string;
  name: string;
  lastActive: string;
  browser: string;
  os: string;
  ipAddress: string;
  trusted: boolean;
}

class PrivacyService {
  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/privacy${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Privacy operation failed');
    }

    return response.json();
  }

  async getPrivacySettings(): Promise<PrivacySettings> {
    return this.fetchWithAuth('/settings');
  }

  async updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<PrivacySettings> {
    return this.fetchWithAuth('/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  }

  async getDevices(): Promise<DeviceInfo[]> {
    return this.fetchWithAuth('/devices');
  }

  async removeDevice(deviceId: string): Promise<void> {
    await this.fetchWithAuth(`/devices/${deviceId}`, {
      method: 'DELETE',
    });
  }

  async trustDevice(deviceId: string): Promise<void> {
    await this.fetchWithAuth(`/devices/${deviceId}/trust`, {
      method: 'POST',
    });
  }

  async enable2FA(): Promise<{ qrCode: string; backupCodes: string[] }> {
    return this.fetchWithAuth('/2fa/enable', {
      method: 'POST',
    });
  }

  async verify2FA(code: string): Promise<{ verified: boolean }> {
    return this.fetchWithAuth('/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async disable2FA(code: string): Promise<void> {
    await this.fetchWithAuth('/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async createBackup(): Promise<{ backupId: string; encryptedKey: string }> {
    const backupKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    const exportedKey = await crypto.subtle.exportKey('raw', backupKey);
    const encryptedKey = await encryptMessage(
      new TextDecoder().decode(exportedKey),
      'self'
    );

    return this.fetchWithAuth('/backup', {
      method: 'POST',
      body: JSON.stringify({ encryptedKey }),
    });
  }

  async restoreBackup(backupId: string, encryptedKey: string): Promise<void> {
    await this.fetchWithAuth('/backup/restore', {
      method: 'POST',
      body: JSON.stringify({ backupId, encryptedKey }),
    });
  }

  async deleteAccount(password: string): Promise<void> {
    await this.fetchWithAuth('/account', {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    });
  }

  async exportData(): Promise<Blob> {
    const response = await fetch('/api/privacy/export', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export data');
    }

    return response.blob();
  }

  async getMessageRetentionStats(): Promise<{
    totalMessages: number;
    oldestMessage: string;
    storageUsed: number;
  }> {
    return this.fetchWithAuth('/retention/stats');
  }

  async clearMessageHistory(before: Date): Promise<void> {
    await this.fetchWithAuth('/messages/clear', {
      method: 'POST',
      body: JSON.stringify({ before: before.toISOString() }),
    });
  }

  async updateReadReceipts(enabled: boolean): Promise<void> {
    await this.fetchWithAuth('/read-receipts', {
      method: 'PUT',
      body: JSON.stringify({ enabled }),
    });
  }

  async getPrivacyLogs(): Promise<Array<{
    event: string;
    timestamp: string;
    deviceInfo: Partial<DeviceInfo>;
  }>> {
    return this.fetchWithAuth('/logs');
  }

  async setMessageExpiry(messageId: string, expirySeconds: number): Promise<void> {
    await this.fetchWithAuth('/message-expiry', {
      method: 'POST',
      body: JSON.stringify({ messageId, expirySeconds }),
    });
  }

  async setThreadRetention(threadId: string, retentionPeriod: number): Promise<void> {
    await this.fetchWithAuth('/thread-retention', {
      method: 'POST',
      body: JSON.stringify({ threadId, retentionPeriod }),
    });
  }

  async checkMessageVisibility(messageId: string): Promise<boolean> {
    const { visible } = await this.fetchWithAuth(`/message/${messageId}/visibility`);
    return visible;
  }

  async checkScreenshotPermission(threadId: string): Promise<boolean> {
    const { allowed } = await this.fetchWithAuth(`/thread/${threadId}/screenshot-permission`);
    return allowed;
  }

  async getExpiredMessages(threadId: string): Promise<string[]> {
    return this.fetchWithAuth(`/thread/${threadId}/expired-messages`);
  }
}

export const privacyService = new PrivacyService();
export default privacyService;
