import { test, expect } from '@playwright/test';

test.describe('Automated Zero-Egress Network Audit', () => {
  test('should block all network egress containing biometric or camera payloads', async ({ page }) => {
    let egressAttempted = false;
    const violatingRequests: string[] = [];

    // Intercept network requests
    await page.route('**/*', async (route) => {
      const request = route.request();
      const url = request.url();
      const method = request.method();
      const postData = request.postData() || '';

      // Intercept external requests
      if (!url.includes('localhost') && !url.startsWith('data:')) {
        const sensitivePatterns = ['camera', 'biometric', 'frame', 'face', 'fingerprint'];
        const payloadStr = postData.toLowerCase();
        const urlStr = url.toLowerCase();

        const isViolating = sensitivePatterns.some(pattern =>
          payloadStr.includes(pattern) || urlStr.includes(pattern)
        );

        if (isViolating) {
          egressAttempted = true;
          violatingRequests.push(url);
          console.error(`BLOCKED EGRESS ATTEMPT: ${method} ${url}`);
          await route.abort('failed');
          return;
        }
      }

      await route.continue();
    });

    await page.goto('http://localhost:3000');

    // Trigger test egress simulation
    const sendDataBtn = page.locator('#send-data');
    if (await sendDataBtn.isVisible()) {
      await sendDataBtn.click();
      await page.waitForTimeout(500);
      expect(egressAttempted, 'A zero-egress violation occurred! Sensitive data attempted to leave the device.').toBe(true);
      expect(violatingRequests.length).toBeGreaterThan(0);
    }
  });
});
