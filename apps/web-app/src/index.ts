import { ClickwrapConsentModal, createProtectedCameraStream } from "@ar-trion/compliance";
import { LocalInferenceRuntime } from "@ar-trion/perception";
import { WebGPUCapabilityDetector } from "@ar-trion/rendering";

export async function bootstrapApp(container: HTMLElement): Promise<void> {
  // Step 1: Detect WebGPU support and explicitly reject WebGL
  const gpuSupported = await WebGPUCapabilityDetector.checkSupport();
  if (!gpuSupported.supported) {
    container.innerHTML = `<div class="error-banner">${gpuSupported.reason}</div>`;
    return;
  }

  // Step 2: Render BIPA Consent Modal
  const modal = new ClickwrapConsentModal({
    onConsentGranted: async (record) => {
      console.log("Consent granted:", record);
      const stream = await createProtectedCameraStream();
      console.log("Protected camera stream initialized with zero-egress:", stream);
    },
    onConsentDeclined: () => {
      console.log("Consent declined by user.");
    }
  });

  container.appendChild(modal.render());
}
