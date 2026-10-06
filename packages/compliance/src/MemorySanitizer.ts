export interface RawFrame {
  source: "camera";
  data: Uint8ClampedArray;
  landmarks?: Array<Float32Array>;
}

/** Zeroes all volatile frame and landmark buffers; caller must then drop references. */
export function sanitizeFrame(frame: RawFrame | null | undefined): void {
  if (!frame) return;
  frame.data.fill(0);
  for (const landmark of frame.landmarks ?? []) landmark.fill(0);
  frame.landmarks = [];
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
