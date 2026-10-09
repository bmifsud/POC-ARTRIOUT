export * from "./WebGPUCapabilityDetector.ts";
export * from "./EmscriptenConfig.ts";
export const renderingContracts = {
  gpuApi: "WebGPU",
  fallback: "Camera and perception must remain disabled without WebGPU",
  dataLocation: "volatile browser memory"
} as const;
