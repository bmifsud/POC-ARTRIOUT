export interface EphemeralFrameData {
  source?: 'camera' | string;
  data?: Uint8ClampedArray | Float32Array | Uint8Array | null;
  landmarks?: Array<Float32Array | number[]> | null;
  imageBitmap?: ImageBitmap | null;
  canvasContext?: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  extraBuffers?: Array<ArrayBufferView | null> | null;
}

export class MemorySanitizer {
  public static purgeFrame(frame: EphemeralFrameData | null | undefined): void {
    if (!frame) return;

    if (frame.data) {
      if ('fill' in frame.data && typeof frame.data.fill === 'function') {
        frame.data.fill(0);
      }
      frame.data = null;
    }

    if (frame.landmarks && Array.isArray(frame.landmarks)) {
      for (let i = 0; i < frame.landmarks.length; i++) {
        const lm = frame.landmarks[i];
        if (lm && 'fill' in lm && typeof (lm as any).fill === 'function') {
          (lm as any).fill(0);
        } else if (Array.isArray(lm)) {
          lm.fill(0);
          lm.length = 0;
        }
      }
      frame.landmarks.length = 0;
      frame.landmarks = null;
    }

    if (frame.imageBitmap) {
      if (typeof frame.imageBitmap.close === 'function') {
        frame.imageBitmap.close();
      }
      frame.imageBitmap = null;
    }

    if (frame.canvasContext && frame.canvasContext.canvas) {
      const { width, height } = frame.canvasContext.canvas;
      if (width > 0 && height > 0) {
        frame.canvasContext.clearRect(0, 0, width, height);
        try {
          const imgData = frame.canvasContext.getImageData(0, 0, width, height);
          imgData.data.fill(0);
          frame.canvasContext.putImageData(imgData, 0, 0);
        } catch {
          // Ignore cross-origin canvas error
        }
      }
      frame.canvasContext = null;
    }

    if (frame.extraBuffers && Array.isArray(frame.extraBuffers)) {
      for (let i = 0; i < frame.extraBuffers.length; i++) {
        const buf = frame.extraBuffers[i];
        if (buf && 'fill' in buf && typeof (buf as any).fill === 'function') {
          (buf as any).fill(0);
        }
      }
      frame.extraBuffers.length = 0;
      frame.extraBuffers = null;
    }
  }

  public static terminateSession(contexts?: Array<CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null>, buffers?: Array<ArrayBufferView | null>): void {
    if (buffers) {
      for (const buf of buffers) {
        if (buf && 'fill' in buf && typeof (buf as any).fill === 'function') {
          (buf as any).fill(0);
        }
      }
    }
    if (contexts) {
      for (const ctx of contexts) {
        if (ctx && ctx.canvas && ctx.canvas.width > 0 && ctx.canvas.height > 0) {
          ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
          try {
            const imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
            imgData.data.fill(0);
            ctx.putImageData(imgData, 0, 0);
          } catch {
            // Ignore cross-origin canvas error
          }
        }
      }
    }
  }
}

export interface RawFrame {
  source: 'camera';
  data: Uint8ClampedArray;
  landmarks?: Array<Float32Array>;
}

export function sanitizeFrame(frame: RawFrame | null | undefined): void {
  MemorySanitizer.purgeFrame(frame as EphemeralFrameData);
}

export function createEphemeralFrameLoop(
  requestFrame: (frame: RawFrame) => void,
  sanitize: (frame: RawFrame) => void = sanitizeFrame
): (frame: RawFrame) => void {
  return frame => {
    try {
      requestFrame(frame);
    } finally {
      sanitize(frame);
    }
  };
}
