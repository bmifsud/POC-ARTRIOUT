import { test, expect } from '@playwright/test';
import { Engine } from '../../apps/poc-sandbox/src/Engine';
import { Point3D } from '../../packages/perception/src/mediapipe/NailExtractor';

if (typeof globalThis.document === 'undefined') {
  (globalThis as any).document = {
    createElement: (tag: string) => {
      if (tag === 'canvas') {
        return {
          getContext: () => ({}),
          toDataURL: () => ''
        };
      }
      return {};
    }
  };
}

if (typeof globalThis.requestAnimationFrame === 'undefined') {
  (globalThis as any).requestAnimationFrame = (cb: () => void) => setTimeout(cb, 16) as any;
  (globalThis as any).cancelAnimationFrame = (id: any) => clearTimeout(id);
}

test.describe('AR Engine Animation Loop Performance', () => {
  test('should execute frame loop synchronously without blocking on lighting estimation', async () => {
    const canvas = document.createElement('canvas') as any;
    const container = document.createElement('div') as any;

    const engine = new Engine({
      canvasElement: canvas,
      modalContainer: container,
    });

    const mockVideo = document.createElement('video') as any;
    (engine as any).videoElement = mockVideo;
    (engine as any).isRunning = true;

    const mockLandmarks: Point3D[] = Array.from({ length: 21 }, (_, i) => ({
      x: (i % 5) * 0.1,
      y: Math.floor(i / 5) * 0.15,
      z: (i % 3) * 0.05
    }));

    (engine as any).handTracker = {
      detectForVideo: () => ({ landmarks: [mockLandmarks] }),
      close: () => {}
    };

    (engine as any).renderer = {
      render: () => {},
      captureSnapshot: () => null
    };

    let estimationCount = 0;
    (engine as any).lightingEstimator = {
      estimateLighting: async () => {
        estimationCount++;
        await new Promise(resolve => setTimeout(resolve, 10));
        return {
          directionalLightVector: [0, 1, 0] as [number, number, number],
          lightIntensity: 1.5,
          environmentMapData: new Float32Array(64 * 64 * 3),
          inferenceTimeMs: 10
        };
      },
      close: () => {}
    };

    const start = performance.now();
    for (let i = 0; i < 10; i++) {
      const result = (engine as any).loop();
      if (result && typeof (result as any).then === 'function') {
        await result;
      }
    }
    const durationMs = performance.now() - start;

    console.log(`[Optimized Measurement] 10 frame ticks completed in ${durationMs.toFixed(2)}ms`);

    // Decoupled loop completes synchronously in < 20ms (baseline was ~104-108ms)
    expect(durationMs).toBeLessThan(20);

    engine.stop();
  });
});
