/** Zeroes all volatile frame and landmark buffers; caller must then drop references. */
export function sanitizeFrame(frame) {
    if (!frame)
        return;
    frame.data.fill(0);
    for (const landmark of frame.landmarks ?? [])
        landmark.fill(0);
    frame.landmarks = [];
}
export function createEphemeralFrameLoop(requestFrame, sanitize = sanitizeFrame) {
    return frame => {
        try {
            requestFrame(frame);
        }
        finally {
            sanitize(frame);
        }
    };
}
