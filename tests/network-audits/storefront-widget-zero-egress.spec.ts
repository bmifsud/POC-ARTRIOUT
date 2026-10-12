import { test, expect } from '@playwright/test';

test.describe('Storefront Widget Zero-Egress Network Audit', () => {
  test('should assert 0 external egress network requests during storefront widget operation', async ({ page }) => {
    let externalEgressCount = 0;
    const externalRequests: string[] = [];

    await page.route('**/*', async (route) => {
      const request = route.request();
      const url = request.url();

      if (!url.includes('localhost') && !url.includes('127.0.0.1') && !url.startsWith('data:') && !url.startsWith('blob:')) {
        externalEgressCount++;
        externalRequests.push(`${request.method()} ${url}`);
        await route.abort('failed');
        return;
      }

      await route.continue();
    });

    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000);

    expect(externalEgressCount, `Zero-egress violation! External requests detected: ${externalRequests.join(', ')}`).toBe(0);
  });
});
