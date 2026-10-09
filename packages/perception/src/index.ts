export * from "./LocalInferenceRuntime.ts";
export * from "./MediaPipeHandLandmarker.ts";
export * from "./NetworkEgressGuard.ts";
export const perceptionContracts = {
  execution: "local-only",
  allowedRuntimes: ["onnxruntime-web", "litert", "@xenova/transformers"],
  networkPolicy: "zero-egress"
} as const;
