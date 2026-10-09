import { ClickwrapConsentModal, createProtectedCameraStream, ConsentStore, ConsentRecord } from "@ar-trion/compliance";
import { LocalInferenceRuntime } from "@ar-trion/perception";
import { WebGPUCapabilityDetector } from "@ar-trion/rendering";

class MemoryConsentStore implements ConsentStore {
  private record: ConsentRecord | null = null;
  async get(): Promise<ConsentRecord | null> { return this.record; }
  async save(record: ConsentRecord): Promise<void> { this.record = record; }
}

export async function bootstrapApp(container: HTMLElement): Promise<void> {
  const gpuSupported = await WebGPUCapabilityDetector.checkSupport();
  if (!gpuSupported.supported) {
    const errorBanner = document.createElement("div");
    errorBanner.className = "error-banner";
    errorBanner.textContent = gpuSupported.reason || "WebGPU is not supported";
    container.appendChild(errorBanner);
    return;
  }

  const modal = new ClickwrapConsentModal({
    store: new MemoryConsentStore(),
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
