export class MemorySanitizer {
    static purgeFrame(frame) {
        if (!frame)
            return;
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
                }
                else if (Array.isArray(lm)) {
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
                if (buf && 'fill' in buf && typeof buf.fill === 'function') {
                    buf.fill(0);
                }
            }
            frame.extraBuffers.length = 0;
            frame.extraBuffers = null;
        }
    }
}
export function sanitizeFrame(frame) {
    MemorySanitizer.purgeFrame(frame);
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
