import { ClickwrapConsent, MemorySanitizer, EphemeralFrameData } from '@ar-trion/compliance';
import { HandTracker, NailExtractor, OcclusionMask, LightingEstimator, Point3D, LightingEstimate } from '@ar-trion/perception';
import { WebGPURenderer, NailMaterialCatalog, RenderTransform } from '@ar-trion/rendering';

export interface EngineConfig {
  canvasElement: HTMLCanvasElement;
  modalContainer: HTMLElement;
  selectedMaterialKey?: string;
}

export class Engine {
  private config: EngineConfig;
  private consent: ClickwrapConsent;
  private handTracker: HandTracker;
  private nailExtractor: NailExtractor;
  private occlusionMask: OcclusionMask;
  private lightingEstimator: LightingEstimator;
  private renderer: WebGPURenderer;

  private videoElement: HTMLVideoElement | null = null;
  private mediaStream: MediaStream | null = null;
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;

  private cachedLighting: LightingEstimate = {
    directionalLightVector: [0.577, 0.577, 0.577],
    lightIntensity: 1.0,
    environmentMapData: new Float32Array(64 * 64 * 3),
    inferenceTimeMs: 0
  };
  private isEstimatingLighting: boolean = false;

  constructor(config: EngineConfig) {
    this.config = config;
    this.consent = new ClickwrapConsent();
    this.handTracker = new HandTracker();
    this.nailExtractor = new NailExtractor();
    this.occlusionMask = new OcclusionMask();
    this.lightingEstimator = new LightingEstimator();
    this.renderer = new WebGPURenderer(config.canvasElement);
  }

  public async start(): Promise<void> {
    await this.consent.renderModal(this.config.modalContainer, async () => {
      await this.initEnginePipeline();
    });
  }

  private async initEnginePipeline(): Promise<void> {
    this.mediaStream = await this.consent.requestCameraStream();

    this.videoElement = document.createElement('video');
    this.videoElement.srcObject = this.mediaStream;
    this.videoElement.autoplay = true;
    this.videoElement.playsInline = true;

    await new Promise<void>((resolve) => {
      if (!this.videoElement) return resolve();
      if (this.videoElement.readyState >= 2 && this.videoElement.videoWidth > 0) {
        resolve();
      } else {
        const onLoaded = () => {
          this.videoElement?.removeEventListener('loadeddata', onLoaded);
          resolve();
        };
        this.videoElement.addEventListener('loadeddata', onLoaded);
        setTimeout(resolve, 2000);
      }
    });

    await this.videoElement.play().catch(() => {});

    // Initialize perception & rendering components
    await this.handTracker.initialize();
    await this.lightingEstimator.initialize();
    await this.renderer.initialize();

    this.isRunning = true;
    this.loop();
  }

  public setMaterial(materialKey: string): void {
    if (NailMaterialCatalog[materialKey]) {
      this.config.selectedMaterialKey = materialKey;
    }
  }

  public getAvailableMaterials(): string[] {
    return Object.keys(NailMaterialCatalog);
  }

  public exportSnapshot(): string | null {
    return this.renderer.captureSnapshot();
  }

  private triggerAsyncLightingUpdate(): void {
    if (this.isEstimatingLighting || !this.videoElement || !this.isRunning) return;

    this.isEstimatingLighting = true;
    this.lightingEstimator.estimateLighting(this.videoElement)
      .then((lighting) => {
        if (this.isRunning) {
          this.cachedLighting = lighting;
        }
      })
      .catch((err) => {
        console.warn('Asynchronous lighting estimation failed:', err);
      })
      .finally(() => {
        this.isEstimatingLighting = false;
      });
  }

  private loop = (): void => {
    if (!this.isRunning || !this.videoElement) return;

    const frameTimestamp = performance.now();
    let currentFrameData: EphemeralFrameData | null = null;

    try {
      // 1. Track hand landmarks via MediaPipe Wasm GPU
      const result = this.handTracker.detectForVideo(this.videoElement, frameTimestamp);

      if (result && result.landmarks && result.landmarks.length > 0) {
        const rawLandmarks = result.landmarks[0] as Point3D[];

        // 2. Extract distal phalanx nail beds (3D centers, normals, scale)
        const nailTransforms = this.nailExtractor.extractNails(rawLandmarks);

        // 3. Evaluate occlusion on curled fingers
        const occlusionMap = this.occlusionMask.evaluateOcclusion(rawLandmarks, nailTransforms);

        // 4. Estimate scene lighting asynchronously in background without blocking render loop
        this.triggerAsyncLightingUpdate();
        const lighting = this.cachedLighting;

        // 5. Build render transforms for unoccluded nails
        const activeMaterial = NailMaterialCatalog[this.config.selectedMaterialKey || 'highGlossCrimson'] || NailMaterialCatalog.highGlossCrimson;
        const renderTransforms: RenderTransform[] = [];

        const identity4x4 = new Float32Array([
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          0, 0, 0, 1
        ]);

        for (const nail of nailTransforms) {
          const isOccluded = occlusionMap.get(nail.finger);
          if (!isOccluded) {
            const modelMatrix = new Float32Array([
              nail.scale.x, 0, 0, 0,
              0, nail.scale.y, 0, 0,
              0, 0, nail.scale.z, 0,
              nail.center.x, nail.center.y, nail.center.z, 1
            ]);

            renderTransforms.push({
              modelMatrix,
              viewProjectionMatrix: identity4x4,
              normalMatrix: identity4x4,
              lightDirection: [
                lighting.directionalLightVector[0],
                lighting.directionalLightVector[1],
                lighting.directionalLightVector[2],
                lighting.lightIntensity
              ],
              material: activeMaterial
            });
          }
        }

        // 6. WebGPU draw dispatch
        this.renderer.render(renderTransforms);

        currentFrameData = {
          source: 'camera',
          landmarks: rawLandmarks.map(p => new Float32Array([p.x, p.y, p.z]))
        };
      }
    } catch (err) {
      console.error('Error in AR Engine animation tick:', err);
    } finally {
      // 7. EPHEMERAL RAM MEMORY HYGIENE:
      if (currentFrameData) {
        MemorySanitizer.purgeFrame(currentFrameData);
        currentFrameData = null;
      }

      if (this.isRunning) {
        this.animationFrameId = requestAnimationFrame(this.loop);
      }
    }
  };

  public stop(): void {
    this.isRunning = false;
    this.isEstimatingLighting = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    this.handTracker.close();
    this.lightingEstimator.close();
  }
}
