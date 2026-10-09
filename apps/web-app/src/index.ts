import { ClickwrapConsentModal, MemoryConsentStore, createProtectedCameraStream } from "../../../packages/compliance/src/index.ts";
import { LocalInferenceRuntime } from "../../../packages/perception/src/index.ts";
import { WebGPUCapabilityDetector } from "../../../packages/rendering/src/index.ts";

export async function bootstrapApp(container: HTMLElement): Promise<void> {
  const gpuSupported = await WebGPUCapabilityDetector.checkSupport();
  if (!gpuSupported.supported) {
    container.replaceChildren();
    const errorBanner = document.createElement("div");
    errorBanner.className = "error-banner";
    errorBanner.textContent = gpuSupported.reason || "WebGPU is not supported on this device.";
    container.appendChild(errorBanner);
    return;
  }

  const store = new MemoryConsentStore();

  const modal = new ClickwrapConsentModal({
    store,
    onConsentGranted: async (record) => {
      console.log("Consent granted:", record);
      const stream = await createProtectedCameraStream(store);
      console.log("Protected camera stream initialized with zero-egress:", stream);
    },
    onConsentDeclined: () => {
      console.log("Consent declined by user.");
    },
    onConsentRevoked: () => {
      console.log("Consent revoked by user.");
    }
  });

  container.appendChild(modal.render());
}
