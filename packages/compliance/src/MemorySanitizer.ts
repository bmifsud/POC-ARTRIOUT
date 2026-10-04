export interface RawFrame {
  source: "camera";
  data: Uint8ClampedArray;
  landmarks?: Array<Float32Array>;
}

/** Check if typed array is completely zeroed out */
export function isBufferZeroed(buffer: Uint8ClampedArray | Float32Array): boolean {
  for (let i = 0; i < buffer.length; i++) {
    if (buffer[i] !== 0) return false;
  }
  return true;
}

/** Check if an entire RawFrame is completely sanitized */
export function isFrameSanitized(frame: RawFrame): boolean {
  if (!isBufferZeroed(frame.data)) return false;
  if (frame.landmarks && frame.landmarks.length > 0) {
    for (const landmark of frame.landmarks) {
      if (!isBufferZeroed(landmark)) return false;
    }
  }
  return true;
}

/** Zeroes all volatile frame and landmark buffers; caller must then drop references. */
export function purgeFrame(frame: RawFrame | null | undefined): void {
  if (!frame) return;
  frame.data.fill(0);
  for (const landmark of frame.landmarks ?? []) {
    landmark.fill(0);
  }
  frame.landmarks = [];
}

/** Wraps a frame processing callback in a try-finally loop guaranteeing zeroing */
export function createEphemeralFrameLoop(
  processFrame: (frame: RawFrame) => void,
  sanitize: (frame: RawFrame) => void = purgeFrame
): (frame: RawFrame) => void {
  return (frame: RawFrame) => {
    try {
      processFrame(frame);
    } finally {
      sanitize(frame);
    }
  };
}

/**
 * Ephemeral ScratchBufferPool manages volatile reusable memory chunks
 * ensuring zero data retention across frame boundaries.
 */
export class EphemeralScratchPool {
  private frameBuffer: Uint8ClampedArray;
  private landmarkBuffers: Float32Array[] = [];

  constructor(frameByteLength: number, landmarkCount = 21, coordsPerLandmark = 3) {
    this.frameBuffer = new Uint8ClampedArray(frameByteLength);
    for (let i = 0; i < landmarkCount; i++) {
      this.landmarkBuffers.push(new Float32Array(coordsPerLandmark));
    }
  }

  public acquireFrame(): RawFrame {
    return {
      source: "camera",
      data: this.frameBuffer,
      landmarks: this.landmarkBuffers
    };
  }

  public releaseAndSanitize(frame: RawFrame): void {
    purgeFrame(frame);
  }

  public getRawBuffer(): Uint8ClampedArray {
    return this.frameBuffer;
  }
}
