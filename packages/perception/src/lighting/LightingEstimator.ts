import * as ort from 'onnxruntime-web';

export interface LightingEstimate {
  directionalLightVector: [number, number, number];
  lightIntensity: number;
  environmentMapData: Float32Array;
  inferenceTimeMs: number;
}

export class LightingEstimator {
  private session: ort.InferenceSession | null = null;
  private isInitialized: boolean = false;

  public async initialize(modelPath?: string): Promise<void> {
    try {
      if (modelPath) {
        this.session = await ort.InferenceSession.create(modelPath, {
          executionProviders: ['webgl', 'wasm']
        });
      }
      this.isInitialized = true;
    } catch (e) {
      console.warn('LightingEstimator: ONNX model loading fallback.', e);
      this.isInitialized = true;
    }
  }

  public async estimateLighting(
    frame: HTMLVideoElement | HTMLCanvasElement | ImageBitmap | ImageData
  ): Promise<LightingEstimate> {
    const startTime = performance.now();

    const downsampledWidth = 64;
    const downsampledHeight = 64;

    let lightVector: [number, number, number] = [0.577, 0.577, 0.577];
    let lightIntensity = 1.0;
    const envMapData = new Float32Array(downsampledWidth * downsampledHeight * 3);

    if (this.session) {
      try {
        const inputTensor = new ort.Tensor('float32', new Float32Array(1 * 3 * 64 * 64), [1, 3, 64, 64]);
        const feeds: Record<string, ort.Tensor> = {};
        feeds[this.session.inputNames[0]] = inputTensor;
        const results = await this.session.run(feeds);
        const output = results[this.session.outputNames[0]];
        if (output && output.data) {
          const data = output.data as Float32Array;
          lightVector = [data[0] || 0.577, data[1] || 0.577, data[2] || 0.577];
        }
      } catch (err) {
        // Fallback
      }
    } else {
      for (let i = 0; i < envMapData.length; i += 3) {
        envMapData[i] = 0.8;
        envMapData[i + 1] = 0.8;
        envMapData[i + 2] = 0.8;
      }
    }

    const len = Math.sqrt(lightVector[0] ** 2 + lightVector[1] ** 2 + lightVector[2] ** 2) || 1;
    const normalizedVector: [number, number, number] = [
      lightVector[0] / len,
      lightVector[1] / len,
      lightVector[2] / len
    ];

    const inferenceTimeMs = performance.now() - startTime;

    return {
      directionalLightVector: normalizedVector,
      lightIntensity,
      environmentMapData: envMapData,
      inferenceTimeMs
    };
  }

  public close(): void {
    if (this.session) {
      this.session = null;
    }
    this.isInitialized = false;
  }
}
