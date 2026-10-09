import { ClickwrapConsentModal, createProtectedCameraStream } from "@ar-trion/compliance";
import { WebGPUCapabilityDetector } from "@ar-trion/rendering";
class MemoryConsentStore {
    record = null;
    async get() { return this.record; }
    async save(record) { this.record = record; }
}
export async function bootstrapApp(container) {
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
