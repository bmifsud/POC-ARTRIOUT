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
  private isClosed: boolean = false;
  private offscreenCanvas: OffscreenCanvas | HTMLCanvasElement | null = null;
  private ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null = null;

  public async initialize(modelPath?: string): Promise<void> {
    this.isClosed = false;

    if (modelPath && (modelPath.startsWith('http://') || modelPath.startsWith('https://'))) {
      throw new Error(`Zero-Egress Violation: Remote lighting model URL "${modelPath}" rejected. Must use local offline bundled path.`);
    }

    try {
      if (modelPath) {
        const session = await ort.InferenceSession.create(modelPath, {
          executionProviders: ['webgl', 'wasm']
        });

        if (this.isClosed) {
          session.release();
          return;
        }

        this.session = session;
      }
      this.isInitialized = true;
    } catch (e) {
      console.warn('LightingEstimator: ONNX model loading fallback to synthetic EnvMapNet heuristic.', e);
      if (!this.isClosed) {
        this.isInitialized = true;
      }
    }
  }

  public async estimateLighting(
    frame: HTMLVideoElement | HTMLCanvasElement | ImageBitmap | ImageData
  ): Promise<LightingEstimate> {
    const startTime = performance.now();

    const downsampledWidth = 64;
    const downsampledHeight = 64;

    const pixelData = this.extractPixelData(frame, downsampledWidth, downsampledHeight);

    const envMapData = new Float32Array(downsampledWidth * downsampledHeight * 3);
    const inputTensorData = new Float32Array(1 * 3 * downsampledWidth * downsampledHeight);

    let totalLuminance = 0;
    let maxLum = 0;
    let brightestX = downsampledWidth / 2;
    let brightestY = downsampledHeight / 2;

    for (let y = 0; y < downsampledHeight; y++) {
      for (let x = 0; x < downsampledWidth; x++) {
        const pixelIdx = (y * downsampledWidth + x) * 4;
        const r = (pixelData ? pixelData[pixelIdx] : 128) / 255;
        const g = (pixelData ? pixelData[pixelIdx + 1] : 128) / 255;
        const b = (pixelData ? pixelData[pixelIdx + 2] : 128) / 255;

        const planeSize = downsampledWidth * downsampledHeight;
        const hwIdx = y * downsampledWidth + x;
        inputTensorData[hwIdx] = r;
        inputTensorData[planeSize + hwIdx] = g;
        inputTensorData[2 * planeSize + hwIdx] = b;

        envMapData[hwIdx * 3] = r;
        envMapData[hwIdx * 3 + 1] = g;
        envMapData[hwIdx * 3 + 2] = b;

        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        totalLuminance += lum;
        if (lum > maxLum) {
          maxLum = lum;
          brightestX = x;
          brightestY = y;
        }
      }
    }

    const avgLuminance = totalLuminance / (downsampledWidth * downsampledHeight);
    let lightIntensity = Math.min(Math.max(avgLuminance * 2.0, 0.2), 2.0);

    let lightVector: [number, number, number] = [0.577, 0.577, 0.577];

    if (!this.isClosed && this.session) {
      try {
        const inputTensor = new ort.Tensor('float32', inputTensorData, [1, 3, downsampledWidth, downsampledHeight]);
        const feeds: Record<string, ort.Tensor> = {};
        feeds[this.session.inputNames[0]] = inputTensor;
        const results = await this.session.run(feeds);
        const output = results[this.session.outputNames[0]];
        if (output && output.data) {
          const data = output.data as Float32Array;
          lightVector = [data[0] || 0.577, data[1] || 0.577, data[2] || 0.577];
        }
      } catch (err) {
        lightVector = this.deriveVectorFromBrightestPixel(brightestX, brightestY, downsampledWidth, downsampledHeight);
      }
    } else {
      lightVector = this.deriveVectorFromBrightestPixel(brightestX, brightestY, downsampledWidth, downsampledHeight);
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

  private deriveVectorFromBrightestPixel(
    brightestX: number,
    brightestY: number,
    width: number,
    height: number
  ): [number, number, number] {
    const nx = (brightestX / width) * 2 - 1;
    const ny = -((brightestY / height) * 2 - 1);
    const nz = 1.0;
    return [nx, ny, nz];
  }

  private extractPixelData(
    frame: HTMLVideoElement | HTMLCanvasElement | ImageBitmap | ImageData,
    width: number,
    height: number
  ): Uint8ClampedArray | Uint8Array | null {
    if (typeof ImageData !== 'undefined' && frame instanceof ImageData) {
      return frame.data;
    }

    try {
      if (typeof OffscreenCanvas !== 'undefined') {
        if (!this.offscreenCanvas) {
          this.offscreenCanvas = new OffscreenCanvas(width, height);
          this.ctx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true }) as OffscreenCanvasRenderingContext2D;
        }
      } else if (typeof document !== 'undefined') {
        if (!this.offscreenCanvas) {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          this.offscreenCanvas = canvas;
          this.ctx = canvas.getContext('2d', { willReadFrequently: true });
        }
      }

      if (this.ctx) {
        this.ctx.drawImage(frame as CanvasImageSource, 0, 0, width, height);
        return this.ctx.getImageData(0, 0, width, height).data;
      }
    } catch (e) {
      // Fallback
    }
    return null;
  }

  public close(): void {
    this.isClosed = true;
    if (this.session) {
      this.session.release();
      this.session = null;
    }
    this.offscreenCanvas = null;
    this.ctx = null;
    this.isInitialized = false;
  }
}
