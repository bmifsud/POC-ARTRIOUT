export const perceptionContracts = {
  execution: "local-only",
  allowedRuntimes: ["onnxruntime-web", "litert", "@xenova/transformers"],
  networkPolicy: "zero-egress"
} as const;

export * from "./NetworkEgressGuard.js";
export * from "./LocalInferenceRuntime.js";
export * from "./MediaPipeHandLandmarker.js";
export * from "./mediapipe/HandTracker.js";
export * from "./mediapipe/NailExtractor.js";
export * from "./occlusion/OcclusionMask.js";
export * from "./lighting/LightingEstimator.js";
