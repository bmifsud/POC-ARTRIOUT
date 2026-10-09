import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
export class HandTracker {
    handLandmarker = null;
    isInitialized = false;
    isClosed = false;
    async initialize(options = {}) {
        this.isClosed = false;
        const wasmLoaderPath = options.wasmPath || './assets/wasm';
        const modelPath = options.modelAssetPath || './assets/models/hand_landmarker.task';
        if (wasmLoaderPath.startsWith('http://') || wasmLoaderPath.startsWith('https://')) {
            throw new Error(`Zero-Egress Violation: Remote Wasm URL "${wasmLoaderPath}" rejected. Must use local offline bundled path.`);
        }
        if (modelPath.startsWith('http://') || modelPath.startsWith('https://')) {
            throw new Error(`Zero-Egress Violation: Remote model URL "${modelPath}" rejected. Must use local offline bundled path.`);
        }
        const vision = await FilesetResolver.forVisionTasks(wasmLoaderPath);
        if (this.isClosed) {
            return;
        }
        const landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: modelPath,
                delegate: 'GPU'
            },
            runningMode: 'VIDEO',
            numHands: options.numHands || 1,
            minHandDetectionConfidence: options.minHandDetectionConfidence ?? 0.7,
            minHandPresenceConfidence: options.minHandPresenceConfidence ?? 0.5,
            minTrackingConfidence: options.minTrackingConfidence ?? 0.5
        });
        if (this.isClosed) {
            landmarker.close();
            return;
        }
        this.handLandmarker = landmarker;
        this.isInitialized = true;
    }
    detectForVideo(videoFrame, timestampMs) {
        if (this.isClosed || !this.isInitialized || !this.handLandmarker) {
            return null;
        }
        return this.handLandmarker.detectForVideo(videoFrame, timestampMs);
    }
    close() {
        this.isClosed = true;
        if (this.handLandmarker) {
            this.handLandmarker.close();
            this.handLandmarker = null;
        }
        this.isInitialized = false;
    }
}
