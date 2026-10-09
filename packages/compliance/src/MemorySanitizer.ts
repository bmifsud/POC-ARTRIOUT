export interface RawFrame {
  source: "camera";
  data: Uint8ClampedArray;
  landmarks?: Array<Float32Array>;
}

/** Zeroes all volatile frame and landmark buffers; caller must then drop references. */
export function purgeFrame(frame: RawFrame | null | undefined): void {
  if (!frame) return;
  frame.data.fill(0);
  for (const landmark of frame.landmarks ?? []) landmark.fill(0);
  frame.landmarks = [];
}

export function sanitizeFrame(frame: RawFrame | null | undefined): void {
  purgeFrame(frame);
}

export function isBufferZeroed(buffer: Uint8ClampedArray | Float32Array): boolean {
  for (let i = 0; i < buffer.length; i++) {
    if (buffer[i] !== 0) return false;
  }
  return true;
}

export function isFrameSanitized(frame: RawFrame): boolean {
  return isBufferZeroed(frame.data) && (!frame.landmarks || frame.landmarks.length === 0);
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

export class EphemeralScratchPool {
  private rawBuffer: Uint8ClampedArray;
  private landmarkBuffers: Float32Array[];

  constructor(sizeBytes: number, numLandmarkBuffers = 1, landmarkLength = 63) {
    this.rawBuffer = new Uint8ClampedArray(sizeBytes);
    this.landmarkBuffers = Array.from({ length: numLandmarkBuffers }, () => new Float32Array(landmarkLength));
  }

  public acquireFrame(): RawFrame {
    return {
      source: "camera",
      data: this.rawBuffer,
      landmarks: this.landmarkBuffers
    };
  }

  public releaseAndSanitize(frame: RawFrame): void {
    purgeFrame(frame);
  }

  public getRawBuffer(): Uint8ClampedArray {
    return this.rawBuffer;
  }
}
