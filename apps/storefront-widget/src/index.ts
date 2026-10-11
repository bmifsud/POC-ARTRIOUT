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
import { CameraOverlay } from './CameraOverlay';

export class MemoryConsentStore implements ConsentStore {
  private record: ConsentRecord | null = null;
  async get(): Promise<ConsentRecord | null> { return this.record; }
  async save(record: ConsentRecord): Promise<void> { this.record = record; }
}

export interface StorefrontWidgetOptions {
  containerId?: string;
  autoStart?: boolean;
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

  private currentSessionId: number = 0;
  private isStopped: boolean = true;
  private animationFrameId: number | null = null;
  private stopButton: HTMLButtonElement | null = null;

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

    if (options.autoStart !== false) {
      this.init();
    }
  }

  public async init(): Promise<void> {
    // Prevent duplicate active modals or sessions
    this.stop();

    this.isStopped = false;
    const sessionId = ++this.currentSessionId;

    this.consentModal = new ClickwrapConsentModal({
      store: this.consentStore,
      onConsentGranted: async () => {
        if (this.isStopped || sessionId !== this.currentSessionId) return;
        // Affirm consent on ClickwrapConsent instance so createProtectedCameraStream succeeds
        (this.consent as any).consentGiven = true;
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

      // Check if session was stopped or superseded while awaiting getUserMedia
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

      this.overlay = new CameraOverlay({ container: this.container });
      this.overlay.drawGuideUI();

      // Initialize local edge ML perception pipeline
      this.handTracker = new HandTracker();
      this.nailExtractor = new NailExtractor();
      await this.handTracker.initialize();

      // Add camera stop/revoke button on active UI
      this.addStopButton();

      // Start AR frame animation tick
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

        // Redraw overlay guide with active nail beds
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

  private addStopButton(): void {
    if (this.stopButton) return;
    this.stopButton = document.createElement('button');
    this.stopButton.className = 'ar-trion-stop-btn';
    this.stopButton.textContent = 'Stop Camera / Revoke Consent';
    this.stopButton.style.position = 'absolute';
    this.stopButton.style.bottom = '16px';
    this.stopButton.style.right = '16px';
    this.stopButton.style.zIndex = '20';
    this.stopButton.style.padding = '8px 14px';
    this.stopButton.style.background = '#ef4444';
    this.stopButton.style.color = '#ffffff';
    this.stopButton.style.border = 'none';
    this.stopButton.style.borderRadius = '6px';
    this.stopButton.style.cursor = 'pointer';
    this.stopButton.style.fontWeight = 'bold';

    this.stopButton.addEventListener('click', () => this.stop());
    this.container.appendChild(this.stopButton);
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

    if (this.stopButton && this.stopButton.parentNode) {
      this.stopButton.parentNode.removeChild(this.stopButton);
      this.stopButton = null;
    }

    if (this.handTracker) {
      this.handTracker.close();
      this.handTracker = null;
    }
    this.nailExtractor = null;

    (this.consent as any).consentGiven = false;
    MemorySanitizer.terminateSession();
  }
}

export function autoInitWidget(): void {
  if (typeof window !== 'undefined') {
    (window as any).ARTrionWidget = StorefrontWidget;
    const runInit = () => {
      // Create widget root container if not present, ensuring standalone embed initialization
      new StorefrontWidget({ containerId: 'ar-trion-widget-root' });
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', runInit);
    } else {
      runInit();
    }
  }
}

autoInitWidget();
