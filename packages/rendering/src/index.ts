export const renderingContracts = {
  gpuApi: "WebGPU",
  fallback: "Camera and perception must remain disabled without WebGPU",
  dataLocation: "volatile browser memory"
} as const;

export * from "./WebGPUCapabilityDetector.ts";
export * from "./EmscriptenConfig.ts";
export * from "./webgpu/WebGPURenderer.js";
export * from "./materials/NailMaterials.js";
