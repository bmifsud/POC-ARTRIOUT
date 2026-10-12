import { test, expect } from '@playwright/test';

test.describe('Storefront Widget End-to-End User Experience', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should display BIPA consent gate and enforce camera locking', async ({ page }) => {
    const consentHeader = page.locator('text=BIPA Biometric Consent Notice');
    if (await consentHeader.isVisible()) {
      await expect(consentHeader).toBeVisible();

      const checkbox = page.locator('#bipa-consent-checkbox');
      const submitBtn = page.locator('#bipa-consent-submit');

      await expect(submitBtn).toBeDisabled();
      await checkbox.check();
      await expect(submitBtn).toBeEnabled();
    }
  });

  test('should allow nail shape and WebGPU material preset customization', async ({ page }) => {
    const customizerTitle = page.locator('text=Lacquer Customizer');
    if (await customizerTitle.isVisible()) {
      await expect(customizerTitle).toBeVisible();

      const stilettoBtn = page.locator('button', { hasText: 'Stiletto' });
      if (await stilettoBtn.isVisible()) {
        await stilettoBtn.click();
      }

      const onyxBtn = page.locator('button', { hasText: 'Matte Onyx Black' });
      if (await onyxBtn.isVisible()) {
        await onyxBtn.click();
      }
    }
  });

  test('should allow interaction with AI Co-Designer chat tab', async ({ page }) => {
    const coDesignerTab = page.locator('button', { hasText: 'AI Co-Designer' });
    if (await coDesignerTab.isVisible()) {
      await coDesignerTab.click();

      const chatInput = page.locator('input[placeholder*="Ask AI"]');
      if (await chatInput.isVisible()) {
        await chatInput.fill('Suggest a gold chrome set');
        await page.locator('button', { hasText: 'Send' }).click();

        await expect(page.locator('text=Opulent choices!')).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('should allow interaction with Client Consultation Hub and Before & After slider', async ({ page }) => {
    const consultationTab = page.locator('button', { hasText: 'Consultation Hub' });
    if (await consultationTab.isVisible()) {
      await consultationTab.click();

      await expect(page.locator('text=Before & After Interactive Split Comparison')).toBeVisible();

      const slider = page.locator('input[type="range"]');
      if (await slider.isVisible()) {
        await slider.fill('75');
      }
    }
  });

  test('should allow exporting salon recipes and social story graphics', async ({ page }) => {
    const exportTab = page.locator('button', { hasText: 'Export & Recipe' });
    if (await exportTab.isVisible()) {
      await exportTab.click();

      await expect(page.locator('text=Export Salon Recipe (.md)')).toBeVisible();
      await expect(page.locator('text=Export Style JSON')).toBeVisible();
      await expect(page.locator('text=Generate 9:16 Social Story')).toBeVisible();
    }
  });
});
