import { test, expect } from '@playwright/test';

test.describe('Video Call Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
  });

  test('should initiate a video call', async ({ page }) => {
    // Navigate to contacts
    await page.getByRole('link', { name: 'Contacts' }).click();
    
    // Select a contact and initiate call
    await page.getByTestId('contact-item-0').click();
    await page.getByRole('button', { name: 'Video Call' }).click();
    
    // Verify call interface is shown
    await expect(page.getByTestId('call-container')).toBeVisible();
    await expect(page.getByTestId('local-video')).toBeVisible();
    
    // Check call controls
    await expect(page.getByRole('button', { name: 'Mute' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Stop Video' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Share Screen' })).toBeVisible();
  });

  test('should handle call controls', async ({ page }) => {
    // Start a call
    await page.getByRole('link', { name: 'Contacts' }).click();
    await page.getByTestId('contact-item-0').click();
    await page.getByRole('button', { name: 'Video Call' }).click();
    
    // Test mute functionality
    await page.getByRole('button', { name: 'Mute' }).click();
    await expect(page.getByTestId('mute-indicator')).toBeVisible();
    
    // Test video toggle
    await page.getByRole('button', { name: 'Stop Video' }).click();
    await expect(page.getByTestId('video-off-indicator')).toBeVisible();
    
    // Test screen sharing
    await page.getByRole('button', { name: 'Share Screen' }).click();
    await expect(page.getByTestId('screen-share-indicator')).toBeVisible();
  });

  test('should display call quality indicators', async ({ page }) => {
    // Start a call
    await page.getByRole('link', { name: 'Contacts' }).click();
    await page.getByTestId('contact-item-0').click();
    await page.getByRole('button', { name: 'Video Call' }).click();
    
    // Wait for quality indicators
    await expect(page.getByTestId('connection-quality')).toBeVisible();
    await expect(page.getByTestId('bitrate-indicator')).toBeVisible();
    await expect(page.getByTestId('packet-loss-indicator')).toBeVisible();
  });

  test('should handle call termination', async ({ page }) => {
    // Start a call
    await page.getByRole('link', { name: 'Contacts' }).click();
    await page.getByTestId('contact-item-0').click();
    await page.getByRole('button', { name: 'Video Call' }).click();
    
    // End call
    await page.getByRole('button', { name: 'End Call' }).click();
    
    // Verify call ended
    await expect(page.getByTestId('call-container')).not.toBeVisible();
    await expect(page.getByTestId('call-ended-message')).toBeVisible();
  });
});
