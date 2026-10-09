import { test, expect } from '@playwright/test';

test.describe('Automated Zero-Egress Network Audit', () => {
  test('should block and assert 0 external egress requests containing biometric payloads', async ({ page }) => {
    let externalEgressCount = 0;
    let blockedEgressCount = 0;
    const externalRequests: string[] = [];

    await page.route('**/*', async (route) => {
      const request = route.request();
      const url = request.url();
      const postData = request.postData() || '';

      if (!url.includes('localhost') && !url.includes('127.0.0.1') && !url.startsWith('data:') && !url.startsWith('blob:')) {
        const sensitivePatterns = ['camera', 'biometric', 'frame', 'face', 'fingerprint'];
        const isSensitive = sensitivePatterns.some(pattern =>
          postData.toLowerCase().includes(pattern) || url.toLowerCase().includes(pattern)
        );

        if (isSensitive) {
          blockedEgressCount++;
        } else {
          externalEgressCount++;
          externalRequests.push(`${request.method()} ${url}`);
        }

        await route.abort('failed');
        return;
      }

      await route.continue();
    });

    await page.goto('http://localhost:3000');

    const sendDataBtn = page.locator('#send-data');
    await sendDataBtn.waitFor({ state: 'visible', timeout: 5000 });
    await sendDataBtn.click();

    // Allow time for async click handler network event
    await page.waitForTimeout(500);

    expect(externalEgressCount, `Unblocked external requests emitted: ${externalRequests.join(', ')}`).toBe(0);
    expect(blockedEgressCount, 'Sensitive egress attempt should have been intercepted and blocked').toBeGreaterThan(0);
  });
});
