# Project Requirements & Prerequisites

## Overview
AR Trion is an enterprise web-based Augmented Reality hand-tracking and perception system built with strict regulatory compliance (BIPA, GDPR, CCPA) and high-performance WebGPU rendering.

## 1. Architecture, Compliance, & Privacy Requirements
- **Monorepo Architecture**: Enterprise monorepo layout isolating client applications (`apps/`), perception pipelines (`packages/perception/`), WebGPU rendering modules (`packages/rendering/`), and compliance controls (`packages/compliance/`).
- **BIPA-Compliant Consent Gate**:
  - Hard clickwrap UI modal (`ClickwrapConsent.ts` and `ClickwrapConsentModal.ts`) preventing camera stream enumeration or acquisition without affirmative user authorization.
  - Audit log recording actor identity, UTC ISO timestamp, UUID, and policy version (`1.0.0`).
  - Active stream withdrawal mechanism (`revokeClickwrapConsent`) that immediately stops and releases active `MediaStreamTrack` objects.
  - Camera access wrapper (`createProtectedCameraStream`) throwing a security error on unconsented access attempts.
- **Edge-Only Processing Contract**:
  - All inference runtimes (ONNX Runtime Web, LiteRT, Transformers.js) execute strictly on-device in browser memory via `LocalInferenceRuntime.ts`.
  - Zero egress network policy: `NetworkEgressGuard.ts` intercepts and blocks any outbound network traffic during perception routines.
- **Ephemeral Memory Sanitization**:
  - Volatile RAM buffer management (`MemorySanitizer.ts`) zeroing raw pixel frames (`Uint8ClampedArray`) and biometric landmark coordinates (`Float32Array`) immediately after frame processing cycle completion via `sanitizeFrame` and `EphemeralScratchPool`.

## 2. Toolchain & AI Orchestration Setup
- **Local AI Development Workflow**: Integration with Google Antigravity and OmniRoute pointing to Local LLM Studio at zero API token cost (`.agents/workflows/local-ai-orchestration.json`) coordinating Planner, Coder, QA, and Reviewer personas.
- **WebAssembly & WebGPU Toolchains**:
  - `WebGPUCapabilityDetector.ts` verifying native WebGPU and multi-threading execution.
  - Hard deprecation and rejection of WebGL fallback contexts.
  - Emscripten compilation configuration (`EmscriptenConfig.ts` and `scripts/build-wasm.js`) enabling `-s USE_WEBGPU=1` and `-s USE_PTHREADS=1`.
- **Perception Pipeline Procurement**:
  - Apache-2.0 licensed MediaPipe Hand Landmarker and Palm Detector binary pipeline (`MediaPipeHandLandmarker.ts`).
  - Offline-first model asset resolution.

## 3. Testing & Verification Infrastructure
- **Unit Testing**: Native Node.js test runner covering compliance, consent storage, stream protection, and buffer scrubbing (`tests/compliance.test.js`).
- **Zero-Egress Network Audit**: Automated audit harness (`tests/zero-egress.test.js`) intercepting browser network calls and validating zero remote transmission.
- **WebGPU Capability Testing**: Rendering tests (`tests/rendering.test.js`) verifying adapter validation and WebGL deprecation rejection.
- **All 19 Automated Tests Passing**: Continuous testing concurrency verified across all packages.
