import { monitoringService } from './monitoring';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url?: string;
    type?: string;
    [key: string]: any;
  };
}

class PushNotificationService {
  private static instance: PushNotificationService;
  private registration: ServiceWorkerRegistration | null = null;
  private vapidPublicKey: string = process.env.REACT_APP_VAPID_PUBLIC_KEY || '';

  private constructor() {}

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  public async initialize(registration: ServiceWorkerRegistration): Promise<void> {
    try {
      this.registration = registration;
      await this.setupNotifications();
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      monitoringService.logError({
        type: 'PUSH_NOTIFICATION_ERROR',
        message: 'Failed to initialize push notifications',
        timestamp: new Date().toISOString(),
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
      throw error; // Re-throw the error for proper error handling
    }
  }

  private async setupNotifications(): Promise<void> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await this.subscribeToPushNotifications();
      } else {
        throw new Error(`Notification permission ${permission}`);
      }
    } catch (error) {
      console.error('Error setting up notifications:', error);
      throw error;
    }
  }

  private async subscribeToPushNotifications(): Promise<void> {
    if (!this.registration) {
      throw new Error('Service Worker not registered');
    }

    try {
      // Check for existing subscription
      const existingSubscription = await this.registration.pushManager.getSubscription();
      if (existingSubscription) {
        return; // Already subscribed
      }

      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey),
      });

      // Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        throw new Error(`Failed to subscribe: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw error;
    }
  }

  public async showNotification(payload: NotificationPayload): Promise<void> {
    if (!this.registration) {
      throw new Error('Service Worker not registered');
    }

    try {
      await this.registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/logo192.png',
        badge: payload.badge || '/badge.png',
        tag: payload.tag,
        data: payload.data,
        requireInteraction: true,
        actions: [
          {
            action: 'accept',
            title: 'Accept',
          },
          {
            action: 'decline',
            title: 'Decline',
          },
        ],
      });
    } catch (error) {
      console.error('Error showing notification:', error);
      monitoringService.logError({
        type: 'NOTIFICATION_ERROR',
        message: 'Failed to show notification',
        timestamp: new Date().toISOString(),
        metadata: {
          error: error instanceof Error ? error.message : String(error),
          payload,
        },
      });
      throw error;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export const pushNotificationService = PushNotificationService.getInstance();
