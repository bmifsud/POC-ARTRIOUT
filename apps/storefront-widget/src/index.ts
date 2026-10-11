import {
  ClickwrapConsentModal,
  ClickwrapConsent,
  createProtectedCameraStream,
  ConsentStore,
  ConsentRecord,
  MemorySanitizer
} from '@ar-trion/compliance';
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
  private consent: ClickwrapConsent;
  private consentModal: ClickwrapConsentModal | null = null;
  private overlay: CameraOverlay | null = null;
  private mediaStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;

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
    this.consent = new ClickwrapConsent(new MemoryConsentStore());

    if (options.autoStart !== false) {
      this.init();
    }
  }

  public async init(): Promise<void> {
    const store = new MemoryConsentStore();
    this.consentModal = new ClickwrapConsentModal({
      store,
      onConsentGranted: async () => {
        await this.startARSession();
      },
      onConsentDeclined: () => {
        console.warn('Camera access declined by user.');
      }
    });

    const modalElement = this.consentModal.render();
    this.container.appendChild(modalElement);
  }

  private async startARSession(): Promise<void> {
    try {
      this.mediaStream = await createProtectedCameraStream(this.consent);

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
    } catch (err) {
      console.error('Failed to start AR camera session:', err);
    }
  }

  public stop(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.overlay) {
      this.overlay.destroy();
      this.overlay = null;
    }
    if (this.videoElement && this.videoElement.parentNode) {
      this.videoElement.parentNode.removeChild(this.videoElement);
      this.videoElement = null;
    }
    MemorySanitizer.terminateSession();
  }
}

export function autoInitWidget(): void {
  if (typeof window !== 'undefined') {
    (window as any).ARTrionWidget = StorefrontWidget;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        const root = document.getElementById('ar-trion-widget-root');
        if (root) {
          new StorefrontWidget({ containerId: 'ar-trion-widget-root' });
        }
      });
    } else {
      const root = document.getElementById('ar-trion-widget-root');
      if (root) {
        new StorefrontWidget({ containerId: 'ar-trion-widget-root' });
      }
    }
  }
}

autoInitWidget();
