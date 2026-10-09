import { NetworkEgressGuard } from "./NetworkEgressGuard";
export class LocalInferenceRuntime {
    config;
    isInitialized = false;
    constructor(config) {
        if (config.allowRemoteModelDownload) {
            throw new Error("Edge Security Violation: allowRemoteModelDownload must be false. Models must be bundled locally.");
        }
        if (config.localModelPath.startsWith("http://") || config.localModelPath.startsWith("https://")) {
            NetworkEgressGuard.recordViolation(config.localModelPath, "GET");
            throw new Error(`Edge Security Violation: Remote model URL "${config.localModelPath}" rejected. Only local offline bundled paths are permitted.`);
        }
        this.config = config;
    }
    async initialize() {
        NetworkEgressGuard.activate();
        this.isInitialized = true;
    }
    async inferGeometry(inputBuffer) {
        if (!this.isInitialized) {
            throw new Error("LocalInferenceRuntime must be initialized before processing frames.");
        }
        // Local edge processing simulator adhering to 21 hand landmarks (x, y, z)
        const landmarks = [];
        for (let i = 0; i < 21; i++) {
            const landmark = new Float32Array(3);
            landmark[0] = 0.5 + (i * 0.01);
            landmark[1] = 0.5 + (i * 0.01);
            landmark[2] = 0.0;
            landmarks.push(landmark);
        }
        return {
            landmarks,
            handedness: "right",
            confidence: 0.98
        };
    }
    getRuntime() {
        return this.config.runtime;
    }
    isReady() {
        return this.isInitialized;
    }
}
