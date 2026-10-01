import { test, expect } from '@playwright/test';

test.describe('Mobile Viewport & Touch Event Validations', () => {
  test('should handle touch events correctly', async ({ page, isMobile }) => {
    await page.goto('http://localhost:3000');

    const status = page.locator('#status');
    await expect(status).toHaveText('Waiting...');

    const touchTarget = page.locator('#touch-button');

    if (isMobile) {
      // Dispatch a touch event for mobile platforms
      await touchTarget.dispatchEvent('touchstart');
      await expect(status).toHaveText('Touched via touch event!');
    } else {
      // Fallback to click if not mobile (though our config specifies mobile devices)
      await touchTarget.click();
      await expect(status).toHaveText('Touched!');
    }
  });

  test('should simulate local edge ML model loading within zero-egress context', async ({ page }) => {
    await page.goto('http://localhost:3000');

    const status = page.locator('#status');
    const loadModelBtn = page.locator('#load-model');

    // We expect the model to load successfully locally without network egress
    await loadModelBtn.click();

    await expect(status).toHaveText('Loading model...');
    await expect(status).toHaveText('Model Loaded Successfully (Local)', { timeout: 2000 });
  });
});
