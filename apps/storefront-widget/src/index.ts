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
import { WebGPURenderer, NailMaterialCatalog, NailMaterial, RenderTransform } from '@ar-trion/rendering';
import { CameraOverlay } from './CameraOverlay';
import { generateSalonRecipeMarkdown, generateStyleDefinitionJson, SalonRecipeConfig } from './utils/recipeGenerator';

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
  private renderer: WebGPURenderer | null = null;

  private currentSessionId: number = 0;
  private isStopped: boolean = true;
  private animationFrameId: number | null = null;
  private stopButton: HTMLButtonElement | null = null;

  // Nail Salon Customizer State
  private selectedShape: 'Almond' | 'Coffin' | 'Oval' | 'Square' | 'Stiletto' = 'Stiletto';
  private selectedMaterialKey: string = 'highGlossCrimson';
  private selectedMaterial: NailMaterial = NailMaterialCatalog.highGlossCrimson;

  // UI elements
  private viewportContainer: HTMLElement | null = null;
  private controlsPanel: HTMLElement | null = null;

  constructor(options: StorefrontWidgetOptions = {}) {
    const targetId = options.containerId || 'ar-trion-widget-root';
    let element = document.getElementById(targetId);

    if (!element) {
      element = document.createElement('div');
      element.id = targetId;
      document.body.appendChild(element);
    }

    element.style.width = '100%';
    element.style.minHeight = '360px';
    element.style.display = 'block';
    element.style.position = 'relative';

    this.container = element;
    this.consentStore = new MemoryConsentStore();
    this.consent = new ClickwrapConsent(this.consentStore);

    if (options.autoStart !== false) {
      this.init();
    }
  }

  public async init(): Promise<void> {
    this.stop();

    this.isStopped = false;
    const sessionId = ++this.currentSessionId;

    this.buildSalonLayout();

    if (this.viewportContainer) {
      this.consentModal = new ClickwrapConsentModal({
        store: this.consentStore,
        onConsentGranted: async () => {
          if (this.isStopped || sessionId !== this.currentSessionId) return;
          (this.consent as any).consentGiven = true;
          await this.startARSession(sessionId);
        },
        onConsentDeclined: () => {
          console.warn('Camera access declined by user.');
        }
      });

      const modalElement = this.consentModal.render();
      if (!this.isStopped && sessionId === this.currentSessionId) {
        this.viewportContainer.appendChild(modalElement);
      }
    }
  }

  private buildSalonLayout(): void {
    this.container.innerHTML = '';
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    this.container.style.gap = '16px';
    this.container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    this.container.style.color = '#f4f4f5';

    // Salon Studio Header
    const header = document.createElement('div');
    header.className = 'salon-studio-header';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.padding = '12px 18px';
    header.style.background = 'linear-gradient(90deg, #18181b, #27272a)';
    header.style.borderRadius = '12px';
    header.style.border = '1px solid rgba(244, 114, 182, 0.2)';

    const titleBox = document.createElement('div');
    const mainTitle = document.createElement('h1');
    mainTitle.textContent = 'Nail Lab AR Studio';
    mainTitle.style.margin = '0';
    mainTitle.style.fontSize = '1.25rem';
    mainTitle.style.fontWeight = '700';
    mainTitle.style.background = 'linear-gradient(135deg, #f472b6, #fb7185)';
    mainTitle.style.webkitBackgroundClip = 'text';
    mainTitle.style.webkitTextFillColor = 'transparent';

    const subTitle = document.createElement('div');
    subTitle.textContent = 'Virtual Try-On Lounge & Customizer';
    subTitle.style.fontSize = '0.78rem';
    subTitle.style.color = '#a1a1aa';

    titleBox.appendChild(mainTitle);
    titleBox.appendChild(subTitle);

    const badge = document.createElement('div');
    badge.textContent = '100% On-Device WebGPU';
    badge.style.padding = '6px 12px';
    badge.style.background = 'rgba(244, 114, 182, 0.1)';
    badge.style.color = '#f472b6';
    badge.style.borderRadius = '20px';
    badge.style.border = '1px solid rgba(244, 114, 182, 0.3)';
    badge.style.fontSize = '0.75rem';
    badge.style.fontWeight = '600';

    header.appendChild(titleBox);
    header.appendChild(badge);

    // Main Studio Grid (Viewport + Controls)
    const grid = document.createElement('div');
    grid.className = 'salon-studio-grid';
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = '1fr 1fr';
    grid.style.gap = '16px';
    grid.style.width = '100%';

    // AR Viewport Container
    this.viewportContainer = document.createElement('div');
    this.viewportContainer.className = 'ar-viewport-container';
    this.viewportContainer.style.position = 'relative';
    this.viewportContainer.style.width = '100%';
    this.viewportContainer.style.minHeight = '320px';
    this.viewportContainer.style.height = '100%';
    this.viewportContainer.style.backgroundColor = '#09090b';
    this.viewportContainer.style.borderRadius = '16px';
    this.viewportContainer.style.overflow = 'hidden';
    this.viewportContainer.style.border = '1px solid #27272a';
    this.viewportContainer.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';

    // Studio Controls Panel
    this.controlsPanel = document.createElement('div');
    this.controlsPanel.className = 'salon-controls-panel';
    this.controlsPanel.style.background = '#18181b';
    this.controlsPanel.style.borderRadius = '16px';
    this.controlsPanel.style.padding = '18px';
    this.controlsPanel.style.border = '1px solid #27272a';
    this.controlsPanel.style.display = 'flex';
    this.controlsPanel.style.flexDirection = 'column';
    this.controlsPanel.style.gap = '14px';

    this.renderControlsTabs(this.controlsPanel);

    grid.appendChild(this.viewportContainer);
    grid.appendChild(this.controlsPanel);

    this.container.appendChild(header);
    this.container.appendChild(grid);
  }

  private renderControlsTabs(panel: HTMLElement): void {
    const tabNav = document.createElement('div');
    tabNav.style.display = 'flex';
    tabNav.style.gap = '6px';
    tabNav.style.borderBottom = '1px solid #27272a';
    tabNav.style.paddingBottom = '8px';
    tabNav.style.overflowX = 'auto';

    const tabs = ['Lacquer Customizer', 'AI Co-Designer', 'Consultation Hub', 'Export & Recipe'];
    let activeTab = 'Lacquer Customizer';

    const tabContent = document.createElement('div');
    tabContent.style.display = 'flex';
    tabContent.style.flexDirection = 'column';
    tabContent.style.gap = '14px';
    tabContent.style.marginTop = '6px';

    const renderTabBody = () => {
      tabContent.innerHTML = '';
      if (activeTab === 'Lacquer Customizer') {
        this.renderCustomizerTab(tabContent);
      } else if (activeTab === 'AI Co-Designer') {
        this.renderCoDesignerTab(tabContent);
      } else if (activeTab === 'Consultation Hub') {
        this.renderConsultationTab(tabContent);
      } else if (activeTab === 'Export & Recipe') {
        this.renderExportTab(tabContent);
      }
    };

    tabs.forEach(tabName => {
      const btn = document.createElement('button');
      btn.textContent = tabName;
      btn.type = 'button';
      btn.style.padding = '6px 10px';
      btn.style.border = 'none';
      btn.style.borderRadius = '6px';
      btn.style.cursor = 'pointer';
      btn.style.fontSize = '0.8rem';
      btn.style.fontWeight = '600';
      btn.style.whiteSpace = 'nowrap';
      btn.style.transition = 'all 0.2s ease';

      const updateTabStyle = () => {
        if (activeTab === tabName) {
          btn.style.background = '#ec4899';
          btn.style.color = '#ffffff';
        } else {
          btn.style.background = '#27272a';
          btn.style.color = '#a1a1aa';
        }
      };

      updateTabStyle();

      btn.addEventListener('click', () => {
        activeTab = tabName;
        Array.from(tabNav.children).forEach(child => {
          const cBtn = child as HTMLButtonElement;
          if (cBtn.textContent === activeTab) {
            cBtn.style.background = '#ec4899';
            cBtn.style.color = '#ffffff';
          } else {
            cBtn.style.background = '#27272a';
            cBtn.style.color = '#a1a1aa';
          }
        });
        renderTabBody();
      });

      tabNav.appendChild(btn);
    });

    panel.appendChild(tabNav);
    panel.appendChild(tabContent);

    renderTabBody();
  }

  private renderCustomizerTab(container: HTMLElement): void {
    const title = document.createElement('h3');
    title.textContent = 'Lacquer Customizer';
    title.style.margin = '0';
    title.style.fontSize = '1rem';
    title.style.color = '#f472b6';

    // Shape Selector Section
    const shapeLabel = document.createElement('label');
    shapeLabel.textContent = 'Nail Shape Extension';
    shapeLabel.style.fontSize = '0.8rem';
    shapeLabel.style.fontWeight = '600';
    shapeLabel.style.color = '#e4e4e7';

    const shapeGrid = document.createElement('div');
    shapeGrid.style.display = 'grid';
    shapeGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
    shapeGrid.style.gap = '6px';

    const shapes: Array<'Almond' | 'Coffin' | 'Oval' | 'Square' | 'Stiletto'> = ['Almond', 'Coffin', 'Oval', 'Square', 'Stiletto'];
    shapes.forEach(shape => {
      const btn = document.createElement('button');
      btn.textContent = shape;
      btn.type = 'button';
      btn.style.padding = '6px';
      btn.style.border = '1px solid #3f3f46';
      btn.style.borderRadius = '6px';
      btn.style.background = this.selectedShape === shape ? 'rgba(236, 72, 153, 0.2)' : '#27272a';
      btn.style.color = this.selectedShape === shape ? '#f472b6' : '#d4d4d8';
      btn.style.borderColor = this.selectedShape === shape ? '#ec4899' : '#3f3f46';
      btn.style.cursor = 'pointer';
      btn.style.fontSize = '0.78rem';
      btn.style.fontWeight = '600';

      btn.addEventListener('click', () => {
        this.selectedShape = shape;
        Array.from(shapeGrid.children).forEach(child => {
          const b = child as HTMLButtonElement;
          const isSel = b.textContent === shape;
          b.style.background = isSel ? 'rgba(236, 72, 153, 0.2)' : '#27272a';
          b.style.color = isSel ? '#f472b6' : '#d4d4d8';
          b.style.borderColor = isSel ? '#ec4899' : '#3f3f46';
        });
      });

      shapeGrid.appendChild(btn);
    });

    // Material Preset Selector Section
    const matLabel = document.createElement('label');
    matLabel.textContent = 'WebGPU Material Preset';
    matLabel.style.fontSize = '0.8rem';
    matLabel.style.fontWeight = '600';
    matLabel.style.color = '#e4e4e7';

    const matGrid = document.createElement('div');
    matGrid.style.display = 'grid';
    matGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
    matGrid.style.gap = '6px';

    const materials = [
      { key: 'highGlossCrimson', label: 'High Gloss Crimson', mat: NailMaterialCatalog.highGlossCrimson },
      { key: 'matteBlack', label: 'Matte Onyx Black', mat: NailMaterialCatalog.matteBlack },
      { key: 'roseGoldChrome', label: 'Rose Gold Chrome', mat: NailMaterialCatalog.roseGoldChrome },
      { key: 'pearlGlitter', label: 'Pearl Glitter', mat: NailMaterialCatalog.pearlGlitter }
    ];

    materials.forEach(item => {
      const btn = document.createElement('button');
      btn.textContent = item.label;
      btn.type = 'button';
      btn.style.padding = '8px';
      btn.style.border = '1px solid #3f3f46';
      btn.style.borderRadius = '6px';
      btn.style.background = this.selectedMaterialKey === item.key ? 'rgba(236, 72, 153, 0.2)' : '#27272a';
      btn.style.color = this.selectedMaterialKey === item.key ? '#f472b6' : '#d4d4d8';
      btn.style.borderColor = this.selectedMaterialKey === item.key ? '#ec4899' : '#3f3f46';
      btn.style.cursor = 'pointer';
      btn.style.fontSize = '0.78rem';
      btn.style.fontWeight = '600';

      btn.addEventListener('click', () => {
        this.selectedMaterialKey = item.key;
        this.selectedMaterial = item.mat;
        Array.from(matGrid.children).forEach(child => {
          const b = child as HTMLButtonElement;
          const isSel = b.textContent === item.label;
          b.style.background = isSel ? 'rgba(236, 72, 153, 0.2)' : '#27272a';
          b.style.color = isSel ? '#f472b6' : '#d4d4d8';
          b.style.borderColor = isSel ? '#ec4899' : '#3f3f46';
        });
      });

      matGrid.appendChild(btn);
    });

    container.appendChild(title);
    container.appendChild(shapeLabel);
    container.appendChild(shapeGrid);
    container.appendChild(matLabel);
    container.appendChild(matGrid);
  }

  private renderCoDesignerTab(container: HTMLElement): void {
    const title = document.createElement('h3');
    title.textContent = 'AI Co-Designer';
    title.style.margin = '0';
    title.style.fontSize = '1rem';
    title.style.color = '#f472b6';

    const chatBox = document.createElement('div');
    chatBox.style.background = '#09090b';
    chatBox.style.borderRadius = '8px';
    chatBox.style.padding = '10px';
    chatBox.style.minHeight = '100px';
    chatBox.style.maxHeight = '150px';
    chatBox.style.overflowY = 'auto';
    chatBox.style.display = 'flex';
    chatBox.style.flexDirection = 'column';
    chatBox.style.gap = '6px';
    chatBox.style.fontSize = '0.8rem';

    const welcomeMsg = document.createElement('div');
    welcomeMsg.style.color = '#a1a1aa';
    welcomeMsg.textContent = 'AI Co-Designer: Hello! Describe your vibe or outfit and I will recommend bespoke nail sets.';
    chatBox.appendChild(welcomeMsg);

    const inputRow = document.createElement('div');
    inputRow.style.display = 'flex';
    inputRow.style.gap = '6px';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Ask AI Co-Designer for recommendations...';
    input.style.flex = '1';
    input.style.padding = '6px 10px';
    input.style.borderRadius = '6px';
    input.style.border = '1px solid #3f3f46';
    input.style.background = '#27272a';
    input.style.color = '#ffffff';
    input.style.fontSize = '0.8rem';

    const sendBtn = document.createElement('button');
    sendBtn.type = 'button';
    sendBtn.textContent = 'Send';
    sendBtn.style.padding = '6px 12px';
    sendBtn.style.border = 'none';
    sendBtn.style.borderRadius = '6px';
    sendBtn.style.background = '#ec4899';
    sendBtn.style.color = '#ffffff';
    sendBtn.style.fontWeight = '600';
    sendBtn.style.fontSize = '0.8rem';
    sendBtn.style.cursor = 'pointer';

    const handleSend = () => {
      const text = input.value.trim();
      if (!text) return;

      const userMsg = document.createElement('div');
      userMsg.style.color = '#f472b6';
      userMsg.style.textAlign = 'right';
      userMsg.textContent = `You: ${text}`;
      chatBox.appendChild(userMsg);

      input.value = '';

      setTimeout(() => {
        const replyMsg = document.createElement('div');
        replyMsg.style.color = '#38bdf8';
        replyMsg.textContent = `AI Co-Designer: Opulent choices! I suggest pairing a ${this.selectedShape} shape set with a shimmering high-gloss lacquer finish.`;
        chatBox.appendChild(replyMsg);
        chatBox.scrollTop = chatBox.scrollHeight;
      }, 300);
    };

    sendBtn.addEventListener('click', handleSend);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSend();
    });

    inputRow.appendChild(input);
    inputRow.appendChild(sendBtn);

    container.appendChild(title);
    container.appendChild(chatBox);
    container.appendChild(inputRow);
  }

  private renderConsultationTab(container: HTMLElement): void {
    const title = document.createElement('h3');
    title.textContent = 'Consultation Hub';
    title.style.margin = '0';
    title.style.fontSize = '1rem';
    title.style.color = '#f472b6';

    const subtitle = document.createElement('div');
    subtitle.textContent = 'Before & After Interactive Split Comparison';
    subtitle.style.fontSize = '0.82rem';
    subtitle.style.fontWeight = '600';
    subtitle.style.color = '#e4e4e7';

    const desc = document.createElement('div');
    desc.textContent = 'Slide to compare natural nail bed geometry with real-time AR WebGPU overlay extensions.';
    desc.style.fontSize = '0.75rem';
    desc.style.color = '#a1a1aa';

    const sliderContainer = document.createElement('div');
    sliderContainer.style.display = 'flex';
    sliderContainer.style.flexDirection = 'column';
    sliderContainer.style.gap = '6px';
    sliderContainer.style.marginTop = '6px';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '100';
    slider.value = '50';
    slider.style.width = '100%';
    slider.style.accentColor = '#ec4899';

    const sliderLabels = document.createElement('div');
    sliderLabels.style.display = 'flex';
    sliderLabels.style.justifyContent = 'space-between';
    sliderLabels.style.fontSize = '0.72rem';
    sliderLabels.style.color = '#71717a';

    const leftLabel = document.createElement('span');
    leftLabel.textContent = 'Natural Hand';
    const rightLabel = document.createElement('span');
    rightLabel.textContent = 'WebGPU AR Render';

    sliderLabels.appendChild(leftLabel);
    sliderLabels.appendChild(rightLabel);

    sliderContainer.appendChild(slider);
    sliderContainer.appendChild(sliderLabels);

    container.appendChild(title);
    container.appendChild(subtitle);
    container.appendChild(desc);
    container.appendChild(sliderContainer);
  }

  private renderExportTab(container: HTMLElement): void {
    const title = document.createElement('h3');
    title.textContent = 'Export & Recipe';
    title.style.margin = '0';
    title.style.fontSize = '1rem';
    title.style.color = '#f472b6';

    const desc = document.createElement('div');
    desc.textContent = 'Export technical nail application steps or social media graphics for your salon client.';
    desc.style.fontSize = '0.78rem';
    desc.style.color = '#a1a1aa';

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.flexDirection = 'column';
    actions.style.gap = '8px';
    actions.style.marginTop = '6px';

    const exportMdBtn = document.createElement('button');
    exportMdBtn.type = 'button';
    exportMdBtn.textContent = 'Export Salon Recipe (.md)';
    exportMdBtn.style.padding = '8px';
    exportMdBtn.style.border = '1px solid #ec4899';
    exportMdBtn.style.borderRadius = '6px';
    exportMdBtn.style.background = 'rgba(236, 72, 153, 0.1)';
    exportMdBtn.style.color = '#f472b6';
    exportMdBtn.style.fontWeight = '600';
    exportMdBtn.style.fontSize = '0.8rem';
    exportMdBtn.style.cursor = 'pointer';

    const exportJsonBtn = document.createElement('button');
    exportJsonBtn.type = 'button';
    exportJsonBtn.textContent = 'Export Style JSON';
    exportJsonBtn.style.padding = '8px';
    exportJsonBtn.style.border = '1px solid #3f3f46';
    exportJsonBtn.style.borderRadius = '6px';
    exportJsonBtn.style.background = '#27272a';
    exportJsonBtn.style.color = '#d4d4d8';
    exportJsonBtn.style.fontWeight = '600';
    exportJsonBtn.style.fontSize = '0.8rem';
    exportJsonBtn.style.cursor = 'pointer';

    const exportSocialBtn = document.createElement('button');
    exportSocialBtn.type = 'button';
    exportSocialBtn.textContent = 'Generate 9:16 Social Story';
    exportSocialBtn.style.padding = '8px';
    exportSocialBtn.style.border = '1px solid #3f3f46';
    exportSocialBtn.style.borderRadius = '6px';
    exportSocialBtn.style.background = '#27272a';
    exportSocialBtn.style.color = '#d4d4d8';
    exportSocialBtn.style.fontWeight = '600';
    exportSocialBtn.style.fontSize = '0.8rem';
    exportSocialBtn.style.cursor = 'pointer';

    const getConfig = (): SalonRecipeConfig => ({
      designName: `${this.selectedShape} ${this.selectedMaterial.name}`,
      shape: this.selectedShape,
      materialPreset: this.selectedMaterialKey,
      palette: ['#C8102E', '#1A1A1A', '#E5C158'],
      artistHandle: 'NailLabArtist'
    });

    const triggerDownload = (filename: string, content: string, contentType: string) => {
      const blob = new Blob([content], { type: contentType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    exportMdBtn.addEventListener('click', () => {
      const config = getConfig();
      const md = generateSalonRecipeMarkdown(config);
      triggerDownload(`salon-recipe-${config.shape.toLowerCase()}.md`, md, 'text/markdown');
    });

    exportJsonBtn.addEventListener('click', () => {
      const config = getConfig();
      const json = generateStyleDefinitionJson(config);
      triggerDownload(`salon-style-${config.shape.toLowerCase()}.json`, json, 'application/json');
    });

    exportSocialBtn.addEventListener('click', () => {
      alert(`Generated 9:16 Social Story Card for ${this.selectedShape} set!`);
    });

    actions.appendChild(exportMdBtn);
    actions.appendChild(exportJsonBtn);
    actions.appendChild(exportSocialBtn);

    container.appendChild(title);
    container.appendChild(desc);
    container.appendChild(actions);
  }

  private async startARSession(sessionId: number): Promise<void> {
    try {
      const stream = await createProtectedCameraStream(this.consent);

      if (this.isStopped || sessionId !== this.currentSessionId || !this.viewportContainer) {
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
      this.viewportContainer.appendChild(this.videoElement);

      this.overlay = new CameraOverlay({ container: this.viewportContainer });
      this.overlay.drawGuideUI();

      this.handTracker = new HandTracker();
      this.nailExtractor = new NailExtractor();
      await this.handTracker.initialize({ wasmPath: "/wasm", modelAssetPath: "/models/hand_landmarker.task" });

      this.renderer = new WebGPURenderer(this.overlay.getCanvas());
      await this.renderer.initialize();

      this.addStopButton();

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
          const activeMaterial = this.selectedMaterial;
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

  private addStopButton(): void {
    if (this.stopButton || !this.viewportContainer) return;
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
    this.stopButton.style.fontSize = '0.8rem';

    this.stopButton.addEventListener('click', () => this.stop());
    this.viewportContainer.appendChild(this.stopButton);
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
    this.renderer = null;

    (this.consent as any).consentGiven = false;
    MemorySanitizer.terminateSession();
  }
}

export function autoInitWidget(): void {
  if (typeof window !== 'undefined') {
    (window as any).ARTrionWidget = StorefrontWidget;
    const runInit = () => {
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
