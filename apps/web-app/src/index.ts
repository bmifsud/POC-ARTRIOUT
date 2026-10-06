import { ClickwrapConsentModal, MemoryConsentStore, createProtectedCameraStream } from "@ar-trion/compliance";
import { LocalInferenceRuntime } from "@ar-trion/perception";
import { WebGPUCapabilityDetector } from "@ar-trion/rendering";

export async function bootstrapApp(container: HTMLElement): Promise<void> {
  // Step 1: Detect WebGPU support and explicitly reject WebGL
  const gpuSupported = await WebGPUCapabilityDetector.checkSupport();
  if (!gpuSupported.supported) {
    container.replaceChildren();
    const errorBanner = document.createElement("div");
    errorBanner.className = "error-banner";
    errorBanner.textContent = gpuSupported.reason || "WebGPU is not supported on this device.";
    container.appendChild(errorBanner);
    return;
  }

  // Step 2: Instantiate ConsentStore for BIPA compliance auditing
  const store = new MemoryConsentStore();

  // Step 3: Render BIPA Consent Modal
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
