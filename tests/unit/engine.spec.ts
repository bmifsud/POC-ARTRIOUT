import { test, expect } from '@playwright/test';
import { Engine, EngineConfig } from '../../apps/poc-sandbox/src/Engine';

test.describe('Engine Frame Execution Unit Tests', () => {
  test('should invoke onFrame callback during animation frame loop execution', async () => {
    let capturedTime: number | null = null;

    const config: EngineConfig = {
      canvasElement: {} as HTMLCanvasElement,
      modalContainer: {} as HTMLElement,
      onFrame: (time) => {
        capturedTime = time;
      }
    };

    const engine = new Engine(config);

    // Set running state and mock video element
    (engine as any).isRunning = true;
    (engine as any).videoElement = {} as HTMLVideoElement;

    // Trigger one frame tick
    await (engine as any).loop();

    expect(capturedTime).not.toBeNull();
    expect(typeof capturedTime).toBe('number');
  });

  test('should call stop() and transition isRunning to false when onFrame throws an error', async () => {
    let stopCalled = false;

    const config: EngineConfig = {
      canvasElement: {} as HTMLCanvasElement,
      modalContainer: {} as HTMLElement,
      onFrame: () => {
        throw new Error('Simulated frame execution failure');
      }
    };

    const engine = new Engine(config);

    // Spy on engine.stop
    const originalStop = engine.stop.bind(engine);
    engine.stop = () => {
      stopCalled = true;
      originalStop();
    };

    (engine as any).isRunning = true;
    (engine as any).videoElement = {} as HTMLVideoElement;

    expect(engine.getIsRunning()).toBe(true);

    // Trigger frame tick which should catch error and invoke stop()
    await (engine as any).loop();

    expect(stopCalled).toBe(true);
    expect(engine.getIsRunning()).toBe(false);
  });
});
