/**
 * @jest-environment jsdom
 */

describe('Push Notification UI Tests', () => {
  beforeEach(() => {
    // Mock the Notification API
    global.Notification = {
      permission: 'default',
      requestPermission: jest.fn().mockResolvedValue('granted'),
    };

    // Setup DOM elements
    document.body.innerHTML = `
      <button data-testid="enable-notifications-btn">Enable Notifications</button>
      <div data-testid="notification-settings" style="display: none;">
        <input type="checkbox" data-testid="notification-toggle" />
      </div>
      <div data-testid="notification-error" style="display: none;"></div>
    `;
  });

  test('should handle notification permission request', async () => {
    const button = document.querySelector('[data-testid="enable-notifications-btn"]');
    button.click();

    expect(Notification.requestPermission).toHaveBeenCalled();
  });

  test('should show error message when permission is denied', () => {
    // Mock denied permission
    global.Notification.permission = 'denied';

    const button = document.querySelector('[data-testid="enable-notifications-btn"]');
    button.click();

    const errorElement = document.querySelector('[data-testid="notification-error"]');
    expect(errorElement.style.display).toBe('block');
    expect(errorElement.textContent).toContain('Permission denied');
  });

  test('should toggle notification settings visibility', () => {
    const settings = document.querySelector('[data-testid="notification-settings"]');
    const toggle = document.querySelector('[data-testid="notification-toggle"]');

    // Initially hidden
    expect(settings.style.display).toBe('none');

    // Show settings when permission granted
    global.Notification.permission = 'granted';
    const button = document.querySelector('[data-testid="enable-notifications-btn"]');
    button.click();

    expect(settings.style.display).toBe('block');
  });

  test('should persist notification preference', () => {
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    const toggle = document.querySelector('[data-testid="notification-toggle"]');
    toggle.click();

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'notificationPreference',
      'enabled'
    );
  });
});
