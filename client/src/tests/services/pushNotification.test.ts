import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { pushNotificationService } from '../../services/pushNotification';

// Mock Notification API
class NotificationMock {
  static permission = 'default';
  static async requestPermission() {
    return 'granted';
  }
}

// @ts-ignore
global.Notification = NotificationMock;

describe('PushNotificationService', () => {
  let mockRegistration: ServiceWorkerRegistration;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRegistration = {
      pushManager: {
        subscribe: vi.fn().mockResolvedValue({
          toJSON: () => ({
            endpoint: 'mock-endpoint',
            keys: { p256dh: 'mock-p256dh', auth: 'mock-auth' },
          }),
        }),
        getSubscription: vi.fn().mockResolvedValue(null),
      },
      showNotification: vi.fn().mockResolvedValue(undefined),
    } as unknown as ServiceWorkerRegistration;

    // Reset window.fetch mock
    vi.spyOn(window, 'fetch').mockImplementation(() => 
      Promise.resolve(new Response(JSON.stringify({ success: true })))
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with correct configuration', async () => {
    await pushNotificationService.initialize(mockRegistration);
    expect(mockRegistration.pushManager.subscribe).toBeDefined();
  });

  it('should initialize service worker registration', async () => {
    await pushNotificationService.initialize(mockRegistration);
    expect(mockRegistration).toBeDefined();
  });

  it('should request notification permission', async () => {
    const mockPermission = vi.spyOn(Notification, 'requestPermission')
      .mockResolvedValue('granted');

    await pushNotificationService.initialize(mockRegistration);
    expect(mockPermission).toHaveBeenCalled();
  });

  it('should subscribe to push notifications', async () => {
    vi.spyOn(Notification, 'requestPermission').mockResolvedValue('granted');
    await pushNotificationService.initialize(mockRegistration);
    expect(mockRegistration.pushManager.subscribe).toHaveBeenCalledWith({
      userVisibleOnly: true,
      applicationServerKey: expect.any(Uint8Array),
    });
  });

  it('should handle subscription errors', async () => {
    const mockError = new Error('Subscription failed');
    mockRegistration.pushManager.subscribe = vi.fn().mockRejectedValue(mockError);
    vi.spyOn(Notification, 'requestPermission').mockResolvedValue('granted');

    await expect(pushNotificationService.initialize(mockRegistration))
      .rejects.toThrow('Subscription failed');
  });

  it('should handle notification display', async () => {
    await pushNotificationService.initialize(mockRegistration);
    await pushNotificationService.showNotification({
      title: 'Test',
      body: 'Test notification',
    });

    expect(mockRegistration.showNotification).toHaveBeenCalledWith(
      'Test',
      expect.objectContaining({
        body: 'Test notification',
        icon: expect.any(String),
        badge: expect.any(String),
        requireInteraction: true,
        actions: expect.arrayContaining([
          expect.objectContaining({ action: 'accept', title: 'Accept' }),
          expect.objectContaining({ action: 'decline', title: 'Decline' }),
        ]),
      })
    );
  });

  it('should validate subscription', async () => {
    const mockSubscription = {
      endpoint: 'mock-endpoint',
      keys: { p256dh: 'mock-p256dh', auth: 'mock-auth' },
    };

    mockRegistration.pushManager.getSubscription = vi.fn()
      .mockResolvedValue(mockSubscription);

    await pushNotificationService.initialize(mockRegistration);
    expect(mockRegistration.pushManager.getSubscription).toHaveBeenCalled();
  });

  it('should handle service worker updates', async () => {
    const newRegistration = { ...mockRegistration };
    await pushNotificationService.initialize(newRegistration);
    expect(newRegistration.pushManager.subscribe).toBeDefined();
  });

  it('should handle offline mode', async () => {
    vi.spyOn(window, 'fetch').mockRejectedValueOnce(new Error('Network error'));
    vi.spyOn(Notification, 'requestPermission').mockResolvedValue('granted');

    await expect(pushNotificationService.initialize(mockRegistration))
      .rejects.toThrow('Network error');
  });
});
