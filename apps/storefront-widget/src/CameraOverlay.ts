import { MemorySanitizer, EphemeralFrameData } from '@ar-trion/compliance';

export interface CameraOverlayConfig {
  container: HTMLElement;
  width?: number;
  height?: number;
  showOverlayUI?: boolean;
}

export class CameraOverlay {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private resizeObserver: ResizeObserver | null = null;
  private isDestroyed: boolean = false;

  constructor(config: CameraOverlayConfig) {
    this.container = config.container;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'ar-trion-camera-overlay-canvas';
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.objectFit = 'cover';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '10';

    this.ctx = this.canvas.getContext('2d');

    if (this.container.style.position !== 'relative' && this.container.style.position !== 'absolute') {
      this.container.style.position = 'relative';
    }

    this.container.appendChild(this.canvas);
    this.setupResponsiveViewport();
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  private setupResponsiveViewport(): void {
    this.updateCanvasDimensions();

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        if (!this.isDestroyed) {
          this.updateCanvasDimensions();
        }
      });
      this.resizeObserver.observe(this.container);
    } else {
      window.addEventListener('resize', this.handleResize);
    }
  }

  private handleResize = (): void => {
    if (!this.isDestroyed) {
      this.updateCanvasDimensions();
    }
  };

  public updateCanvasDimensions(): void {
    const rect = this.container.getBoundingClientRect();
    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
    const width = rect.width > 0 ? rect.width : (window.innerWidth || 1280);
    const height = rect.height > 0 ? rect.height : (window.innerHeight || 720);

    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);

    if (this.ctx) {
      this.ctx.scale(dpr, dpr);
    }

    // Re-draw guide UI after canvas resize clears context pixels
    this.drawGuideUI();
  }

  public drawGuideUI(): void {
    if (!this.ctx || this.isDestroyed) return;
    const rect = this.container.getBoundingClientRect();
    const w = rect.width || this.canvas.width;
    const h = rect.height || this.canvas.height;

    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([6, 6]);

    // Draw hand placement target oval
    const centerX = w / 2;
    const centerY = h / 2;
    const radiusX = Math.min(w, h) * 0.25;
    const radiusY = Math.min(w, h) * 0.35;

    this.ctx.beginPath();
    this.ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    this.ctx.stroke();

    this.ctx.restore();
  }

  public clearFrame(frameData?: EphemeralFrameData | null): void {
    if (this.ctx && this.canvas.width > 0 && this.canvas.height > 0) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Ephemeral RAM memory hygiene: destroy raw feeds and biometric landmarks
    if (frameData) {
      MemorySanitizer.purgeFrame(frameData);
    }
  }

  public destroy(): void {
    this.isDestroyed = true;
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    } else if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.handleResize);
    }

    this.clearFrame();

    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    this.ctx = null;
  }
}
