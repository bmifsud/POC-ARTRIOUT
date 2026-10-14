import { test, expect } from '@playwright/test';
import {
  MemorySanitizer,
  sanitizeFrame,
  createEphemeralFrameLoop,
  EphemeralFrameData,
  RawFrame,
} from '../../packages/compliance/src/MemorySanitizer';

test.describe('MemorySanitizer Unit Tests', () => {
  test.describe('purgeFrame', () => {
    test('should handle null and undefined frames gracefully', () => {
      expect(() => MemorySanitizer.purgeFrame(null)).not.toThrow();
      expect(() => MemorySanitizer.purgeFrame(undefined)).not.toThrow();
    });

    test('should zero out typed arrays in frame.data (Uint8Array, Float32Array, Int32Array, Uint8ClampedArray)', () => {
      const u8 = new Uint8Array([1, 2, 3, 4, 5]);
      const frame1: EphemeralFrameData = { data: u8 };
      MemorySanitizer.purgeFrame(frame1);
      expect(Array.from(u8)).toEqual([0, 0, 0, 0, 0]);
      expect(frame1.data).toBeNull();

      const f32 = new Float32Array([1.5, 2.5, 3.5]);
      const frame2: EphemeralFrameData = { data: f32 };
      MemorySanitizer.purgeFrame(frame2);
      expect(Array.from(f32)).toEqual([0, 0, 0]);
      expect(frame2.data).toBeNull();

      const i32 = new Int32Array([10, -20, 30]);
      const frame3: EphemeralFrameData = { data: i32 as any };
      MemorySanitizer.purgeFrame(frame3);
      expect(Array.from(i32)).toEqual([0, 0, 0]);
      expect(frame3.data).toBeNull();

      const u8clamped = new Uint8ClampedArray([255, 128, 64]);
      const frame4: EphemeralFrameData = { data: u8clamped };
      MemorySanitizer.purgeFrame(frame4);
      expect(Array.from(u8clamped)).toEqual([0, 0, 0]);
      expect(frame4.data).toBeNull();

      // Test custom object without fill function in frame.data
      const noFillObj = { length: 2 } as any;
      const frame5: EphemeralFrameData = { data: noFillObj };
      MemorySanitizer.purgeFrame(frame5);
      expect(frame5.data).toBeNull();
    });

    test('should sanitize nested landmark buffers (Float32Array and number[] arrays)', () => {
      const lmF32 = new Float32Array([0.1, 0.2, 0.3]);
      const lmArray = [1, 2, 3, 4];
      const frame: EphemeralFrameData = {
        landmarks: [lmF32, lmArray],
      };

      MemorySanitizer.purgeFrame(frame);

      expect(Array.from(lmF32)).toEqual([0, 0, 0]);
      expect(lmArray).toEqual([0, 0, 0, 0]);
      expect(frame.landmarks).toBeNull();
    });

    test('should handle null/falsy landmark items in landmarks array', () => {
      const frame: EphemeralFrameData = {
        landmarks: [null as any, undefined as any, new Float32Array([1, 2])],
      };
      expect(() => MemorySanitizer.purgeFrame(frame)).not.toThrow();
      expect(frame.landmarks).toBeNull();
    });

    test('should close imageBitmap if present', () => {
      let closed = false;
      const mockImageBitmap = {
        close: () => {
          closed = true;
        },
      } as unknown as ImageBitmap;

      const frame: EphemeralFrameData = {
        imageBitmap: mockImageBitmap,
      };

      MemorySanitizer.purgeFrame(frame);

      expect(closed).toBe(true);
      expect(frame.imageBitmap).toBeNull();
    });

    test('should handle imageBitmap without close function', () => {
      const mockImageBitmap = {} as unknown as ImageBitmap;
      const frame: EphemeralFrameData = { imageBitmap: mockImageBitmap };
      expect(() => MemorySanitizer.purgeFrame(frame)).not.toThrow();
      expect(frame.imageBitmap).toBeNull();
    });

    test('should clear canvas context and fill imageData with zeros', () => {
      let cleared = false;
      let putData: ImageData | null = null;

      const mockImageData = {
        data: new Uint8ClampedArray([255, 255, 255, 255]),
      } as unknown as ImageData;

      const mockCanvas = { width: 2, height: 2 };
      const mockCtx = {
        canvas: mockCanvas,
        clearRect: (_x: number, _y: number, _w: number, _h: number) => {
          cleared = true;
        },
        getImageData: (_x: number, _y: number, _w: number, _h: number) => {
          return mockImageData;
        },
        putImageData: (imgData: ImageData, _x: number, _y: number) => {
          putData = imgData;
        },
      } as unknown as CanvasRenderingContext2D;

      const frame: EphemeralFrameData = {
        canvasContext: mockCtx,
      };

      MemorySanitizer.purgeFrame(frame);

      expect(cleared).toBe(true);
      expect(putData).not.toBeNull();
      expect(Array.from((putData as any).data)).toEqual([0, 0, 0, 0]);
      expect(frame.canvasContext).toBeNull();
    });

    test('should catch and ignore cross-origin errors during canvas getImageData', () => {
      const mockCanvas = { width: 2, height: 2 };
      const mockCtx = {
        canvas: mockCanvas,
        clearRect: () => {},
        getImageData: () => {
          throw new Error('Tainted canvas cross-origin error');
        },
        putImageData: () => {},
      } as unknown as CanvasRenderingContext2D;

      const frame: EphemeralFrameData = {
        canvasContext: mockCtx,
      };

      expect(() => MemorySanitizer.purgeFrame(frame)).not.toThrow();
      expect(frame.canvasContext).toBeNull();
    });

    test('should skip canvas clearing if canvas dimensions are zero or canvas is missing', () => {
      const mockCtx1 = {
        canvas: { width: 0, height: 100 },
      } as unknown as CanvasRenderingContext2D;

      const frame1: EphemeralFrameData = { canvasContext: mockCtx1 };
      MemorySanitizer.purgeFrame(frame1);
      expect(frame1.canvasContext).toBeNull();

      const mockCtx2 = {
        canvas: null,
      } as unknown as CanvasRenderingContext2D;

      const frame2: EphemeralFrameData = { canvasContext: mockCtx2 };
      MemorySanitizer.purgeFrame(frame2);
      expect(frame2.canvasContext).toEqual(mockCtx2);
    });

    test('should sanitize extraBuffers array', () => {
      const buf1 = new Uint8Array([10, 20, 30]);
      const buf2 = new Float32Array([1.1, 2.2]);
      const bufNoFill = { length: 2 } as any;
      const frame: EphemeralFrameData = {
        extraBuffers: [buf1, null, buf2, bufNoFill],
      };

      MemorySanitizer.purgeFrame(frame);

      expect(Array.from(buf1)).toEqual([0, 0, 0]);
      expect(Array.from(buf2)).toEqual([0, 0]);
      expect(frame.extraBuffers).toBeNull();
    });
  });

  test.describe('terminateSession', () => {
    test('should handle undefined or null parameters', () => {
      expect(() => MemorySanitizer.terminateSession()).not.toThrow();
      expect(() => MemorySanitizer.terminateSession(undefined, undefined)).not.toThrow();
    });

    test('should zero out buffers and clear canvas contexts', () => {
      const buf1 = new Uint8Array([5, 10, 15]);
      const buf2 = new Float32Array([0.5, 1.5]);
      const bufNoFill = { length: 2 } as any;

      let cleared = false;
      const mockImageData = { data: new Uint8ClampedArray([100, 100]) } as unknown as ImageData;
      const mockCtx = {
        canvas: { width: 10, height: 10 },
        clearRect: () => {
          cleared = true;
        },
        getImageData: () => mockImageData,
        putImageData: () => {},
      } as unknown as CanvasRenderingContext2D;

      const mockCtxNoCanvas = {} as unknown as CanvasRenderingContext2D;

      MemorySanitizer.terminateSession([mockCtx, null, mockCtxNoCanvas], [buf1, null, buf2, bufNoFill]);

      expect(Array.from(buf1)).toEqual([0, 0, 0]);
      expect(Array.from(buf2)).toEqual([0, 0]);
      expect(cleared).toBe(true);
      expect(Array.from(mockImageData.data)).toEqual([0, 0]);
    });

    test('should catch cross-origin error in terminateSession', () => {
      const mockCtx = {
        canvas: { width: 10, height: 10 },
        clearRect: () => {},
        getImageData: () => {
          throw new Error('SecurityError');
        },
      } as unknown as CanvasRenderingContext2D;

      expect(() => MemorySanitizer.terminateSession([mockCtx])).not.toThrow();
    });
  });

  test.describe('sanitizeFrame helper function', () => {
    test('should purge frame using sanitizeFrame helper', () => {
      const data = new Uint8ClampedArray([1, 2, 3]);
      const landmarks = [new Float32Array([0.5, 0.6])];
      const frame: RawFrame = {
        source: 'camera',
        data,
        landmarks,
      };

      sanitizeFrame(frame);

      expect(Array.from(data)).toEqual([0, 0, 0]);
      expect(frame.data).toBeNull();
      expect(frame.landmarks).toBeNull();
    });
  });

  test.describe('createEphemeralFrameLoop', () => {
    test('should process frame and automatically purge it in finally block using default sanitize function', () => {
      const data = new Uint8ClampedArray([10, 20, 30]);
      const frame: RawFrame = {
        source: 'camera',
        data,
      };

      let processedDataVal: number = 0;
      const process = createEphemeralFrameLoop(f => {
        processedDataVal = f.data[0];
      });

      process(frame);

      expect(processedDataVal).toBe(10);
      expect(Array.from(data)).toEqual([0, 0, 0]);
      expect(frame.data).toBeNull();
    });

    test('should process frame and automatically purge it in finally block using custom sanitize function', () => {
      const data = new Uint8ClampedArray([10, 20, 30]);
      const frame: RawFrame = {
        source: 'camera',
        data,
      };

      let customSanitized = false;
      const customSanitize = (f: RawFrame) => {
        customSanitized = true;
        sanitizeFrame(f);
      };

      const process = createEphemeralFrameLoop(
        f => {
          expect(f.data[0]).toBe(10);
        },
        customSanitize
      );

      process(frame);

      expect(customSanitized).toBe(true);
      expect(frame.data).toBeNull();
    });

    test('should ensure sanitize runs even if requestFrame throws an error', () => {
      const data = new Uint8ClampedArray([10, 20, 30]);
      const frame: RawFrame = {
        source: 'camera',
        data,
      };

      const process = createEphemeralFrameLoop(_f => {
        throw new Error('Frame processing failed');
      });

      expect(() => process(frame)).toThrow('Frame processing failed');
      expect(Array.from(data)).toEqual([0, 0, 0]);
      expect(frame.data).toBeNull();
    });
  });
});
