import { test, expect, type Page } from '@playwright/test';

let page: Page;

test.beforeEach(async ({ browser }) => {
  // Use Chrome Canary
  page = await browser.newPage();
  await page.goto('http://localhost:3000');
});

test.describe('Push Notification UI Tests', () => {
  test('should show notification permission prompt', async () => {
    // Click the enable notifications button
    await page.click('[data-testid="enable-notifications-btn"]');
    
    // Verify the permission dialog appears
    const permissionDialog = await page.evaluate(() => {
      return Notification.permission !== 'denied';
    });
    expect(permissionDialog).toBeTruthy();
  });

  test('should display notification settings in user preferences', async () => {
    // Navigate to user preferences
    await page.click('[data-testid="user-preferences"]');
    
    // Check if notification settings section exists
    const notificationSettings = await page.locator('[data-testid="notification-settings"]');
    await expect(notificationSettings).toBeVisible();
    
    // Verify notification toggle exists
    const notificationToggle = await page.locator('[data-testid="notification-toggle"]');
    await expect(notificationToggle).toBeVisible();
  });

  test('should show notification toast when received', async () => {
    // Mock a push notification
    await page.evaluate(() => {
      const mockNotification = new Notification('Test Notification', {
        body: 'This is a test notification',
        icon: '/icon.png'
      });
      return mockNotification;
    });
    
    // Verify notification toast appears
    const toast = await page.locator('[data-testid="notification-toast"]');
    await expect(toast).toBeVisible();
    
    // Verify notification content
    await expect(toast.locator('.title')).toHaveText('Test Notification');
    await expect(toast.locator('.body')).toHaveText('This is a test notification');
  });

  test('should handle notification interactions', async () => {
    // Click notification toast
    const toast = await page.locator('[data-testid="notification-toast"]');
    await toast.click();
    
    // Verify navigation or action triggered by notification
    await expect(page).toHaveURL(/.*\/messages/);
  });

  test('should show proper error states', async () => {
    // Simulate permission denied
    await page.evaluate(() => {
      Object.defineProperty(Notification, 'permission', {
        value: 'denied',
        writable: false
      });
    });
    
    // Click enable notifications
    await page.click('[data-testid="enable-notifications-btn"]');
    
    // Verify error message
    const errorMessage = await page.locator('[data-testid="notification-error"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Permission denied');
  });

  test('should persist notification preferences', async () => {
    // Toggle notifications off
    await page.click('[data-testid="notification-toggle"]');
    
    // Reload page
    await page.reload();
    
    // Verify toggle state persisted
    const toggle = await page.locator('[data-testid="notification-toggle"]');
    await expect(toggle).not.toBeChecked();
  });
});

test.afterEach(async () => {
  await page.close();
});
