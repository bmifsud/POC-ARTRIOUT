import { test, expect } from '@playwright/test';
import { MemorySanitizer, EphemeralFrameData } from '../../packages/compliance/src/MemorySanitizer';

test.describe('CameraOverlay & Memory Hygiene Integration', () => {
  test('should verify MemorySanitizer.purgeFrame scrubs raw pixels and landmark coordinates', async () => {
    // Create real raw pixel buffer and biometric landmarks
    const rawPixels = new Uint8ClampedArray([255, 128, 64, 255]);
    const landmarks = [new Float32Array([0.5, 0.5, 0.5])];
    const frameData: EphemeralFrameData = {
      source: 'camera',
      data: rawPixels,
      landmarks: landmarks
    };

    // Purge frame buffers in volatile RAM
    MemorySanitizer.purgeFrame(frameData);

    expect(rawPixels[0]).toBe(0);
    expect(rawPixels[1]).toBe(0);
    expect(landmarks.length).toBe(0);
  });

  test('should verify widget canvas rendering in browser DOM', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Check widget root container existence
    const widgetRoot = page.locator('#ar-trion-widget-root');
    await expect(widgetRoot).toBeVisible();
  });
});
