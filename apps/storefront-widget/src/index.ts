import {
  ClickwrapConsentModal,
  ClickwrapConsent,
  createProtectedCameraStream,
  ConsentStore,
  ConsentRecord,
  MemorySanitizer,
  EphemeralFrameData
} from '@ar-trion/compliance';
import { HandTracker, NailExtractor, Point3D } from '@ar-trion/perception';
import { WebGPURenderer, NailMaterialCatalog, RenderTransform, NailMaterial } from '@ar-trion/rendering';
import { CameraOverlay } from './CameraOverlay';

export class MemoryConsentStore implements ConsentStore {
  private record: ConsentRecord | null = null;
  async get(): Promise<ConsentRecord | null> { return this.record; }
  async save(record: ConsentRecord): Promise<void> { this.record = record; }
}

export interface StorefrontWidgetOptions {
  containerId?: string;
  autoStart?: boolean;
  defaultMaterial?: string;
}

export class StorefrontWidget {
  private container: HTMLElement;
  private consentStore: ConsentStore;
  private consent: ClickwrapConsent;
  private consentModal: ClickwrapConsentModal | null = null;
  private overlay: CameraOverlay | null = null;
  private mediaStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private handTracker: HandTracker | null = null;
  private nailExtractor: NailExtractor | null = null;
  private renderer: WebGPURenderer | null = null;

  private activeMaterialKey: string;
  private currentSessionId: number = 0;
  private isStopped: boolean = true;
  private animationFrameId: number | null = null;
  private stopButton: HTMLButtonElement | null = null;
  private controlsContainer: HTMLElement | null = null;

  constructor(options: StorefrontWidgetOptions = {}) {
    const targetId = options.containerId || 'ar-trion-widget-root';
    let element = document.getElementById(targetId);

    if (!element) {
      element = document.createElement('div');
      element.id = targetId;
      element.style.width = '100%';
      element.style.height = '100%';
      element.style.position = 'relative';
      document.body.appendChild(element);
    }

    this.container = element;
    this.consentStore = new MemoryConsentStore();
    this.consent = new ClickwrapConsent(this.consentStore);
    this.activeMaterialKey = options.defaultMaterial || 'highGlossCrimson';

    if (options.autoStart !== false) {
      this.init();
    }
  }

  public setMaterial(materialKey: string): void {
    if (NailMaterialCatalog[materialKey]) {
      this.activeMaterialKey = materialKey;
    }
  }

  public getAvailableMaterials(): string[] {
    return Object.keys(NailMaterialCatalog);
  }

  public exportSnapshot(): string | null {
    if (this.renderer) {
      return this.renderer.captureSnapshot();
    }
    return null;
  }

  public async init(): Promise<void> {
    this.stop();

    this.isStopped = false;
    const sessionId = ++this.currentSessionId;

    this.consentModal = new ClickwrapConsentModal({
      store: this.consentStore,
      consentInstance: this.consent,
      onConsentGranted: async () => {
        if (this.isStopped || sessionId !== this.currentSessionId) return;
        await this.startARSession(sessionId);
      },
      onConsentDeclined: () => {
        console.warn('Camera access declined by user.');
      }
    });

    const modalElement = this.consentModal.render();
    if (!this.isStopped && sessionId === this.currentSessionId) {
      this.container.appendChild(modalElement);
    }
  }

  private async startARSession(sessionId: number): Promise<void> {
    try {
      const stream = await createProtectedCameraStream(this.consent);

      if (this.isStopped || sessionId !== this.currentSessionId) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      this.mediaStream = stream;

      this.videoElement = document.createElement('video');
      this.videoElement.srcObject = this.mediaStream;
      this.videoElement.autoplay = true;
      this.videoElement.playsInline = true;
      this.videoElement.style.width = '100%';
      this.videoElement.style.height = '100%';
      this.videoElement.style.objectFit = 'cover';
      this.container.appendChild(this.videoElement);

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

      if (this.isStopped || sessionId !== this.currentSessionId) return;

      await this.videoElement.play().catch(() => {});

      this.overlay = new CameraOverlay({ container: this.container });
      this.overlay.drawGuideUI();

      this.handTracker = new HandTracker();
      this.nailExtractor = new NailExtractor();
      await this.handTracker.initialize({ wasmPath: "/wasm", modelAssetPath: "/models/hand_landmarker.task" });

      if (this.isStopped || sessionId !== this.currentSessionId) return;

      this.renderer = new WebGPURenderer(this.overlay.getCanvas());
      await this.renderer.initialize();

      if (this.isStopped || sessionId !== this.currentSessionId) return;

      this.addUIControls();

      this.loop(sessionId);
    } catch (err) {
      console.error('Failed to start AR camera session:', err);
    }
  }

  private loop = (sessionId: number): void => {
    if (this.isStopped || sessionId !== this.currentSessionId || !this.videoElement || !this.handTracker || !this.nailExtractor) {
      return;
    }

    let frameData: EphemeralFrameData | null = null;
    const now = performance.now();

    try {
      const result = this.handTracker.detectForVideo(this.videoElement, now);
      if (result && result.landmarks && result.landmarks.length > 0) {
        const rawLandmarks = result.landmarks[0] as Point3D[];
        const nailTransforms = this.nailExtractor.extractNails(rawLandmarks);

        frameData = {
          source: 'camera',
          landmarks: rawLandmarks.map(p => new Float32Array([p.x, p.y, p.z]))
        };

        if (this.renderer && nailTransforms.length > 0) {
          const activeMaterial: NailMaterial = NailMaterialCatalog[this.activeMaterialKey] || NailMaterialCatalog.highGlossCrimson;
          const identity4x4 = new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
          ]);

          const renderTransforms: RenderTransform[] = nailTransforms.map(nail => ({
            modelMatrix: new Float32Array([
              nail.scale.x, 0, 0, 0,
              0, nail.scale.y, 0, 0,
              0, 0, nail.scale.z, 0,
              nail.center.x, nail.center.y, nail.center.z, 1
            ]),
            viewProjectionMatrix: identity4x4,
            normalMatrix: identity4x4,
            lightDirection: [0.0, 1.0, 1.0, 1.0],
            material: activeMaterial
          }));

          this.renderer.render(renderTransforms);
        }

        if (this.overlay) {
          this.overlay.clearFrame();
          this.overlay.drawGuideUI();
        }
      }
    } catch (err) {
      console.error('Error in widget animation frame loop:', err);
    } finally {
      if (frameData) {
        MemorySanitizer.purgeFrame(frameData);
        frameData = null;
      }

      if (!this.isStopped && sessionId === this.currentSessionId) {
        this.animationFrameId = requestAnimationFrame(() => this.loop(sessionId));
      }
    }
  };

  private addUIControls(): void {
    if (this.controlsContainer) return;

    this.controlsContainer = document.createElement('div');
    this.controlsContainer.className = 'ar-trion-widget-controls';
    this.controlsContainer.style.position = 'absolute';
    this.controlsContainer.style.bottom = '16px';
    this.controlsContainer.style.left = '16px';
    this.controlsContainer.style.right = '16px';
    this.controlsContainer.style.zIndex = '20';
    this.controlsContainer.style.display = 'flex';
    this.controlsContainer.style.justifyContent = 'space-between';
    this.controlsContainer.style.alignItems = 'center';
    this.controlsContainer.style.flexWrap = 'wrap';
    this.controlsContainer.style.gap = '8px';

    const materialGroup = document.createElement('div');
    materialGroup.style.display = 'flex';
    materialGroup.style.alignItems = 'center';
    materialGroup.style.gap = '8px';

    const label = document.createElement('label');
    label.textContent = 'Finish:';
    label.style.color = '#ffffff';
    label.style.fontSize = '12px';
    label.style.fontWeight = 'bold';

    const select = document.createElement('select');
    select.className = 'ar-trion-material-select';
    select.style.padding = '6px 10px';
    select.style.borderRadius = '6px';
    select.style.background = '#1e293b';
    select.style.color = '#ffffff';
    select.style.border = '1px solid #475569';
    select.style.cursor = 'pointer';

    for (const key of this.getAvailableMaterials()) {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = NailMaterialCatalog[key].name;
      if (key === this.activeMaterialKey) {
        option.selected = true;
      }
      select.appendChild(option);
    }

    select.addEventListener('change', (e) => {
      this.setMaterial((e.target as HTMLSelectElement).value);
    });

    materialGroup.appendChild(label);
    materialGroup.appendChild(select);

    const buttonGroup = document.createElement('div');
    buttonGroup.style.display = 'flex';
    buttonGroup.style.gap = '8px';

    const exportBtn = document.createElement('button');
    exportBtn.className = 'ar-trion-export-btn';
    exportBtn.textContent = 'Capture Photo';
    exportBtn.style.padding = '8px 14px';
    exportBtn.style.background = '#3b82f6';
    exportBtn.style.color = '#ffffff';
    exportBtn.style.border = 'none';
    exportBtn.style.borderRadius = '6px';
    exportBtn.style.cursor = 'pointer';
    exportBtn.style.fontWeight = 'bold';

    exportBtn.addEventListener('click', () => {
      const dataUrl = this.exportSnapshot();
      if (dataUrl) {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `ar-nail-tryon-${Date.now()}.png`;
        a.click();
      }
    });

    this.stopButton = document.createElement('button');
    this.stopButton.className = 'ar-trion-stop-btn';
    this.stopButton.textContent = 'Stop Camera';
    this.stopButton.style.padding = '8px 14px';
    this.stopButton.style.background = '#ef4444';
    this.stopButton.style.color = '#ffffff';
    this.stopButton.style.border = 'none';
    this.stopButton.style.borderRadius = '6px';
    this.stopButton.style.cursor = 'pointer';
    this.stopButton.style.fontWeight = 'bold';

    this.stopButton.addEventListener('click', () => this.stop());

    buttonGroup.appendChild(exportBtn);
    buttonGroup.appendChild(this.stopButton);

    this.controlsContainer.appendChild(materialGroup);
    this.controlsContainer.appendChild(buttonGroup);

    this.container.appendChild(this.controlsContainer);
  }

  public stop(): void {
    this.isStopped = true;
    this.currentSessionId++;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.consentModal) {
      this.consentModal.destroy();
      this.consentModal = null;
    }

    if (this.overlay) {
      this.overlay.destroy();
      this.overlay = null;
    }

    if (this.videoElement && this.videoElement.parentNode) {
      this.videoElement.parentNode.removeChild(this.videoElement);
      this.videoElement = null;
    }

    if (this.controlsContainer && this.controlsContainer.parentNode) {
      this.controlsContainer.parentNode.removeChild(this.controlsContainer);
      this.controlsContainer = null;
      this.stopButton = null;
    }

    if (this.handTracker) {
      this.handTracker.close();
      this.handTracker = null;
    }
    this.nailExtractor = null;
    this.renderer = null;

    this.consent.revokeConsent();
    MemorySanitizer.terminateSession();
  }
}

export function autoInitWidget(): void {
  if (typeof window !== 'undefined') {
    (window as any).ARTrionWidget = StorefrontWidget;
    const runInit = () => {
      const widget = new StorefrontWidget({ containerId: 'ar-trion-widget-root' });
      (window as any).ARTrionWidgetInstance = widget;
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', runInit);
    } else {
      runInit();
    }
  }
}

autoInitWidget();
