import {
  HandLandmarker,
  FilesetResolver,
  HandLandmarkerResult
} from '@mediapipe/tasks-vision';

export interface HandTrackerOptions {
  wasmPath?: string;
  numHands?: number;
  minHandDetectionConfidence?: number;
  minHandPresenceConfidence?: number;
  minTrackingConfidence?: number;
}

export class HandTracker {
  private handLandmarker: HandLandmarker | null = null;
  private isInitialized: boolean = false;

  public async initialize(options: HandTrackerOptions = {}): Promise<void> {
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

  public detectForVideo(videoFrame: HTMLVideoElement | HTMLCanvasElement, timestampMs: number): HandLandmarkerResult | null {
    if (!this.isInitialized || !this.handLandmarker) {
      return null;
    }
    return this.handLandmarker.detectForVideo(videoFrame, timestampMs);
  }

  public close(): void {
    if (this.handLandmarker) {
      this.handLandmarker.close();
      this.handLandmarker = null;
    }
    this.isInitialized = false;
  }
}
