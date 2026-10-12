import { test, expect } from '@playwright/test';
import { MemorySanitizer, sanitizeFrame, createEphemeralFrameLoop, EphemeralFrameData, RawFrame } from '../../packages/compliance/src/MemorySanitizer';

test.describe('MemorySanitizer Compliance Unit Tests', () => {
  test('should purge frame with imageBitmap, canvasContext, and extraBuffers', () => {
    let closed = false;
    const mockImageBitmap = {
      close: () => { closed = true; }
    } as unknown as ImageBitmap;

    let cleared = false;
    const mockCtx = {
      canvas: { width: 10, height: 10 },
      clearRect: () => { cleared = true; }
    } as unknown as CanvasRenderingContext2D;

    const extraBuf = new Uint8Array([1, 2, 3]);

    const frame: EphemeralFrameData = {
      source: 'camera',
      data: new Uint8Array([10, 20]),
      landmarks: [[1, 2, 3]],
      imageBitmap: mockImageBitmap,
      canvasContext: mockCtx,
      extraBuffers: [extraBuf]
    };

    MemorySanitizer.purgeFrame(frame);

    expect(frame.data).toBeNull();
    expect(frame.landmarks).toBeNull();
    expect(closed).toBe(true);
    expect(cleared).toBe(true);
    expect(extraBuf[0]).toBe(0);
    expect(frame.extraBuffers).toBeNull();
  });

  test('should terminate session wiping contexts and buffers', () => {
    let cleared = false;
    const mockCtx = {
      canvas: { width: 10, height: 10 },
      clearRect: () => { cleared = true; }
    } as unknown as CanvasRenderingContext2D;

    const buf = new Float32Array([1.5, 2.5]);

    MemorySanitizer.terminateSession([mockCtx], [buf]);

    expect(cleared).toBe(true);
    expect(buf[0]).toBe(0);
  });

  test('should handle sanitizeFrame and createEphemeralFrameLoop', () => {
    const rawPixels = new Uint8ClampedArray([255, 0, 0, 255]);
    const rawFrame: RawFrame = {
      source: 'camera',
      data: rawPixels,
      landmarks: [new Float32Array([1, 2, 3])]
    };

    let processed = false;
    const loop = createEphemeralFrameLoop((f) => {
      processed = true;
      expect(f.data[0]).toBe(255);
    });

    loop(rawFrame);

    expect(processed).toBe(true);
    expect(rawPixels[0]).toBe(0);
  });
});
