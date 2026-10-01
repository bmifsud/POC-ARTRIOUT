import { test, expect } from '@playwright/test';

test.describe('Automated Zero-Egress Network Audit', () => {
  test('should block all network egress containing biometric or camera payloads', async ({ page }) => {
    let egressAttempted = false;
    let violatingRequests: string[] = [];

    // Intercept network requests
    await page.route('**/*', async (route) => {
      const request = route.request();
      const url = request.url();
      const method = request.method();
      const postData = request.postData() || '';

      // We only care about external requests (not localhost, unless testing requires it)
      if (!url.includes('localhost') && !url.startsWith('data:')) {

        // Define sensitive patterns
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
            // Abort the request to ensure zero egress
            await route.abort('failed');
            return;
        }
      }

      // Continue normal requests
      await route.continue();
    });

    await page.goto('http://localhost:3000');

    // Trigger the test block (which simulates an illegal egress attempt)
    const sendDataBtn = page.locator('#send-data');
    await sendDataBtn.click();

    // Wait a brief moment for the async request to trigger
    await page.waitForTimeout(500);

    // Assert that egress was attempted but it was blocked/recorded as a violation
    expect(egressAttempted, 'A zero-egress violation occurred! Sensitive data attempted to leave the device.').toBe(true);
    expect(violatingRequests.length).toBeGreaterThan(0);
  });
});
