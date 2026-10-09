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
      if (frame.data instanceof Uint8ClampedArray || frame.data instanceof Float32Array || frame.data instanceof Uint8Array) {
        frame.data.fill(0);
      }
      frame.data = null;
    }

    if (frame.landmarks && Array.isArray(frame.landmarks)) {
      for (let i = 0; i < frame.landmarks.length; i++) {
        const lm = frame.landmarks[i];
        if (lm instanceof Float32Array) {
          lm.fill(0);
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
      frame.canvasContext.clearRect(0, 0, frame.canvasContext.canvas.width, frame.canvasContext.canvas.height);
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
