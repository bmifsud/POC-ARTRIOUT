import { test, expect } from '@playwright/test';

test.describe('Mobile Viewport & Touch Event Validations', () => {
  test('should handle touch events correctly', async ({ page, isMobile }) => {
    await page.goto('http://localhost:3000');

    const status = page.locator('#status');
    await expect(status).toHaveText('Waiting...');

    const touchTarget = page.locator('#touch-button');

    if (isMobile) {
      await touchTarget.dispatchEvent('touchstart');
      await expect(status).toHaveText('Touched via touch event!');
    } else {
      await touchTarget.click();
      await expect(status).toHaveText('Touched!');
    }
  });

  test('should simulate local edge ML model loading within zero-egress context', async ({ page }) => {
    await page.goto('http://localhost:3000');

    const status = page.locator('#status');
    const loadModelBtn = page.locator('#load-model');

    await expect(status).toHaveText('Waiting...');
    await loadModelBtn.click();

    await expect(status).toHaveText('Model Loaded Successfully (Local)');
  });
});
