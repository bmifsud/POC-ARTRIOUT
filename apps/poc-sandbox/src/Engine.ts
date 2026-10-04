import { HandTracker } from "../../../packages/perception/src/mediapipe/HandTracker.js";
import { OcclusionMask } from "../../../packages/perception/src/occlusion/OcclusionMask.js";
import { LightingEstimator } from "../../../packages/perception/src/lighting/LightingEstimator.js";
import { WebGPURenderer } from "../../../packages/rendering/src/webgpu/WebGPURenderer.js";
import { purgeFrame, EphemeralScratchPool } from "../../../packages/compliance/src/MemorySanitizer.js";

export class Engine {
  tracker = new HandTracker();
  occlusion = new OcclusionMask();
  lighting = new LightingEstimator();
  renderer = new WebGPURenderer();
  pool = new EphemeralScratchPool(1280 * 720 * 4);

  async start(canvas: HTMLCanvasElement) {
    await this.tracker.initialize();
    await this.renderer.init(canvas);

    const loop = async () => {
      const frame = this.pool.acquireFrame();
      try {
        const landmarks = await this.tracker.track(frame.data);
        const light = await this.lighting.estimateLighting(frame.data);
        if (landmarks.length >= 21) {
          this.occlusion.generateMask(0.5, landmarks[9], landmarks[0]);
        }
      } finally {
        this.pool.releaseAndSanitize(frame);
      }
      requestAnimationFrame(loop);
    };
    loop();
  }
}
