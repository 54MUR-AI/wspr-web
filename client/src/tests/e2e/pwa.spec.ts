import { test, expect } from '@playwright/test';

test.describe('Progressive Web App Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show install prompt', async ({ page }) => {
    // Trigger beforeinstallprompt event
    await page.evaluate(() => {
      window.dispatchEvent(new Event('beforeinstallprompt'));
    });

    // Verify install prompt is shown
    await expect(page.getByTestId('pwa-install-prompt')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Install App' })).toBeVisible();
  });

  test('should handle offline mode', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true);
    
    // Navigate to a page
    await page.goto('/messages');
    
    // Verify offline UI is shown
    await expect(page.getByTestId('offline-indicator')).toBeVisible();
    
    // Verify cached content is accessible
    await expect(page.getByTestId('message-list')).toBeVisible();
    
    // Try to send a message
    await page.getByTestId('message-input').fill('Test message');
    await page.getByRole('button', { name: 'Send' }).click();
    
    // Verify message is queued for sync
    await expect(page.getByTestId('message-pending')).toBeVisible();
    
    // Go online and verify sync
    await context.setOffline(false);
    await expect(page.getByTestId('message-sent')).toBeVisible();
  });

  test('should handle push notifications', async ({ page }) => {
    // Request notification permission
    await page.evaluate(() => {
      return Notification.requestPermission();
    });
    
    // Trigger a test notification
    await page.evaluate(() => {
      const title = 'Test Notification';
      const options = {
        body: 'This is a test notification',
        icon: '/icon.png'
      };
      return new Notification(title, options);
    });
    
    // Verify notification was shown
    const notifications = await page.evaluate(() => {
      return Notification.permission;
    });
    expect(notifications).toBe('granted');
  });

  test('should handle background sync', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true);
    
    // Perform actions that require sync
    await page.getByTestId('profile-image-upload').setInputFiles(['test.jpg']);
    await page.getByRole('button', { name: 'Update Profile' }).click();
    
    // Verify sync pending status
    await expect(page.getByTestId('sync-pending')).toBeVisible();
    
    // Go online and verify sync completion
    await context.setOffline(false);
    await expect(page.getByTestId('sync-complete')).toBeVisible();
    await expect(page.getByTestId('profile-image')).toBeVisible();
  });

  test('should update service worker', async ({ page }) => {
    // Trigger service worker update
    await page.evaluate(() => {
      navigator.serviceWorker.ready.then(registration => {
        registration.update();
      });
    });
    
    // Verify update prompt
    await expect(page.getByTestId('update-available')).toBeVisible();
    
    // Accept update
    await page.getByRole('button', { name: 'Update Now' }).click();
    
    // Verify update completion
    await expect(page.getByTestId('update-complete')).toBeVisible();
  });
});
