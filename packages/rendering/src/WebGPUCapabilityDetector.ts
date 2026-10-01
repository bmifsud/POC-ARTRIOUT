export interface GPUCapabilityReport {
  supported: boolean;
  adapterName?: string;
  isMultiThreaded: boolean;
  reason?: string;
  webGlDeprecatedNotice?: string;
}

export class WebGPUCapabilityDetector {
  /**
   * Checks browser support for native WebGPU and multi-threading,
   * explicitly rejecting WebGL fallbacks.
   */
  public static async checkSupport(customNavigator?: any): Promise<GPUCapabilityReport> {
    const nav = customNavigator || (typeof navigator !== "undefined" ? navigator : null);

    if (!nav) {
      return {
        supported: false,
        isMultiThreaded: false,
        reason: "No navigator environment detected."
      };
    }

    // Check if WebGL is available to issue the explicit deprecation notice
    let webglDetected = false;
    if (typeof document !== "undefined") {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("webgl2");
      if (gl) webglDetected = true;
    }

    if (!nav.gpu) {
      return {
        supported: false,
        isMultiThreaded: false,
        reason: "WebGPU is not supported on this browser or platform.",
        webGlDeprecatedNotice: webglDetected
          ? "WebGL/WebGL2 context detected, but WebGL fallback is strictly deprecated and rejected in AR Trion."
          : undefined
      };
    }

    try {
      const adapter = await nav.gpu.requestAdapter();
      if (!adapter) {
        return {
          supported: false,
          isMultiThreaded: false,
          reason: "WebGPU adapter could not be requested (no compatible GPU found)."
        };
      }

      // Check multi-threading capabilities via crossOriginIsolated & SharedArrayBuffer
      const isMultiThreaded =
        typeof crossOriginIsolated !== "undefined" &&
        crossOriginIsolated &&
        typeof SharedArrayBuffer !== "undefined";

      return {
        supported: true,
        adapterName: adapter.info?.device || "Generic WebGPU Adapter",
        isMultiThreaded,
        webGlDeprecatedNotice: "WebGL execution disabled. Running native WebGPU."
      };
    } catch (err: any) {
      return {
        supported: false,
        isMultiThreaded: false,
        reason: `Failed to initialize WebGPU: ${err?.message || String(err)}`
      };
    }
  }

  /**
   * Hard assertion that throws if WebGPU is not supported or if WebGL is used
   */
  public static async assertWebGPUReady(customNavigator?: any): Promise<void> {
    const report = await this.checkSupport(customNavigator);
    if (!report.supported) {
      throw new Error(
        `WebGPU Initialization Failed: ${report.reason}. WebGL is deprecated and disabled.`
      );
    }
  }
}
