import { ClickwrapConsent, MemorySanitizer } from '@ar-trion/compliance';
import { HandTracker, NailExtractor, OcclusionMask, LightingEstimator } from '@ar-trion/perception';
import { WebGPURenderer, NailMaterialCatalog } from '@ar-trion/rendering';
export class Engine {
    config;
    consent;
    handTracker;
    nailExtractor;
    occlusionMask;
    lightingEstimator;
    renderer;
    videoElement = null;
    mediaStream = null;
    isRunning = false;
    animationFrameId = null;
    constructor(config) {
        this.config = config;
        this.consent = new ClickwrapConsent();
        this.handTracker = new HandTracker();
        this.nailExtractor = new NailExtractor();
        this.occlusionMask = new OcclusionMask();
        this.lightingEstimator = new LightingEstimator();
        this.renderer = new WebGPURenderer(config.canvasElement);
    }
    async start() {
        // 1. Enforce Clickwrap Consent Gating before camera initialization
        // Affirmative consent callback immediately initializes protected camera stream and animation loop
        await this.consent.renderModal(this.config.modalContainer, async () => {
            await this.initEnginePipeline();
        });
    }
    async initEnginePipeline() {
        // Acquire protected camera stream only after affirmative user consent
        this.mediaStream = await this.consent.requestCameraStream();
        this.videoElement = document.createElement('video');
        this.videoElement.srcObject = this.mediaStream;
        this.videoElement.autoplay = true;
        this.videoElement.playsInline = true;
        await this.videoElement.play();
        // Initialize perception & rendering components
        await this.handTracker.initialize();
        await this.lightingEstimator.initialize();
        await this.renderer.initialize();
        this.isRunning = true;
        this.loop();
    }
    loop = async () => {
        if (!this.isRunning || !this.videoElement)
            return;
        const frameTimestamp = performance.now();
        let currentFrameData = null;
        try {
            // 1. Track hand landmarks via MediaPipe Wasm GPU
            const result = this.handTracker.detectForVideo(this.videoElement, frameTimestamp);
            if (result && result.landmarks && result.landmarks.length > 0) {
                const rawLandmarks = result.landmarks[0];
                // 2. Extract distal phalanx nail beds (3D centers, normals, scale)
                const nailTransforms = this.nailExtractor.extractNails(rawLandmarks);
                // 3. Evaluate occlusion on curled fingers
                const occlusionMap = this.occlusionMask.evaluateOcclusion(rawLandmarks, nailTransforms);
                // 4. Estimate scene lighting via downsampled luminance distribution
                const lighting = await this.lightingEstimator.estimateLighting(this.videoElement);
                // 5. Build render transforms for unoccluded nails
                const activeMaterial = NailMaterialCatalog[this.config.selectedMaterialKey || 'highGlossCrimson'] || NailMaterialCatalog.highGlossCrimson;
                const renderTransforms = [];
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
        }
        catch (err) {
            console.error('Error in AR Engine animation tick:', err);
        }
        finally {
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
    stop() {
        this.isRunning = false;
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
