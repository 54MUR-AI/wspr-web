import { errorService } from './error.service';

export interface Device {
  id: string;
  name: string;
  type: string;
  lastActive: number;
  publicKey: string;
  isCurrentDevice: boolean;
}

export interface DeviceSync {
  timestamp: number;
  type: 'message' | 'key' | 'settings';
  data: any;
}

class DeviceService {
  private static instance: DeviceService;
  private devices: Map<string, Device> = new Map();
  private syncQueue: DeviceSync[] = [];
  private readonly MAX_DEVICES = 5;

  private constructor() {
    this.initializeDeviceSync();
  }

  static getInstance(): DeviceService {
    if (!DeviceService.instance) {
      DeviceService.instance = new DeviceService();
    }
    return DeviceService.instance;
  }

  async registerDevice(deviceInfo: Partial<Device>): Promise<Device> {
    try {
      const device: Device = {
        id: crypto.randomUUID(),
        name: deviceInfo.name || 'Unknown Device',
        type: deviceInfo.type || 'browser',
        lastActive: Date.now(),
        publicKey: deviceInfo.publicKey || '',
        isCurrentDevice: true,
      };

      if (this.devices.size >= this.MAX_DEVICES) {
        throw new Error('Maximum number of devices reached');
      }

      this.devices.set(device.id, device);
      await this.syncDevices();
      
      return device;
    } catch (error) {
      errorService.handleError(error, 'DEVICE_REGISTRATION_FAILED', 'high');
      throw error;
    }
  }

  async removeDevice(deviceId: string): Promise<void> {
    try {
      if (!this.devices.has(deviceId)) {
        throw new Error('Device not found');
      }

      this.devices.delete(deviceId);
      await this.syncDevices();
    } catch (error) {
      errorService.handleError(error, 'DEVICE_REMOVAL_FAILED', 'medium');
      throw error;
    }
  }

  getDevices(): Device[] {
    return Array.from(this.devices.values());
  }

  getCurrentDevice(): Device | undefined {
    return Array.from(this.devices.values()).find(device => device.isCurrentDevice);
  }

  async updateDeviceActivity(deviceId: string): Promise<void> {
    const device = this.devices.get(deviceId);
    if (device) {
      device.lastActive = Date.now();
      await this.syncDevices();
    }
  }

  private async syncDevices(): Promise<void> {
    try {
      const devices = Array.from(this.devices.values());
      // Implement sync with server
      this.broadcastDeviceUpdate(devices);
    } catch (error) {
      errorService.handleError(error, 'DEVICE_SYNC_FAILED', 'medium');
    }
  }

  private broadcastDeviceUpdate(devices: Device[]): void {
    window.dispatchEvent(
      new CustomEvent('wspr:devices:updated', { detail: devices })
    );
  }

  private initializeDeviceSync(): void {
    window.addEventListener('wspr:sync:required', this.handleSyncRequest.bind(this));
    window.addEventListener('wspr:device:activity', this.handleDeviceActivity.bind(this));
  }

  private async handleSyncRequest(event: CustomEvent): Promise<void> {
    try {
      const syncData: DeviceSync = {
        timestamp: Date.now(),
        type: event.detail.type,
        data: event.detail.data,
      };

      this.syncQueue.push(syncData);
      await this.processSyncQueue();
    } catch (error) {
      errorService.handleError(error, 'SYNC_REQUEST_FAILED', 'medium');
    }
  }

  private async handleDeviceActivity(event: CustomEvent): Promise<void> {
    const { deviceId } = event.detail;
    await this.updateDeviceActivity(deviceId);
  }

  private async processSyncQueue(): Promise<void> {
    while (this.syncQueue.length > 0) {
      const syncItem = this.syncQueue.shift();
      if (syncItem) {
        try {
          await this.processSyncItem(syncItem);
        } catch (error) {
          errorService.handleError(error, 'SYNC_PROCESSING_FAILED', 'medium');
          this.syncQueue.unshift(syncItem); // Re-add failed item
          break;
        }
      }
    }
  }

  private async processSyncItem(syncItem: DeviceSync): Promise<void> {
    switch (syncItem.type) {
      case 'message':
        await this.syncMessages(syncItem.data);
        break;
      case 'key':
        await this.syncKeys(syncItem.data);
        break;
      case 'settings':
        await this.syncSettings(syncItem.data);
        break;
      default:
        throw new Error(`Unknown sync type: ${syncItem.type}`);
    }
  }

  private async syncMessages(data: any): Promise<void> {
    // Implement message sync logic
  }

  private async syncKeys(data: any): Promise<void> {
    // Implement key sync logic
  }

  private async syncSettings(data: any): Promise<void> {
    // Implement settings sync logic
  }
}

export const deviceService = DeviceService.getInstance();
