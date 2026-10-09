import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
export class HandTracker {
    handLandmarker = null;
    isInitialized = false;
    async initialize(options = {}) {
        const wasmLoaderPath = options.wasmPath || 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
        const vision = await FilesetResolver.forVisionTasks(wasmLoaderPath);
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
                delegate: 'GPU'
            },
            runningMode: 'VIDEO',
            numHands: options.numHands || 1,
            minHandDetectionConfidence: options.minHandDetectionConfidence ?? 0.7,
            minHandPresenceConfidence: options.minHandPresenceConfidence ?? 0.5,
            minTrackingConfidence: options.minTrackingConfidence ?? 0.5
        });
        this.isInitialized = true;
    }
    detectForVideo(videoFrame, timestampMs) {
        if (!this.isInitialized || !this.handLandmarker) {
            return null;
        }
        return this.handLandmarker.detectForVideo(videoFrame, timestampMs);
    }
    close() {
        if (this.handLandmarker) {
            this.handLandmarker.close();
            this.handLandmarker = null;
        }
        this.isInitialized = false;
    }
}
