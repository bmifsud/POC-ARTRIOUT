# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Monorepo Workspaces**: Configured `workspaces` in root [package.json](file:///c:/Users/DELL/Stsack/POC-ARTRIOUT/package.json), created package manifests for `@ar-trion/compliance`, `@ar-trion/perception`, `@ar-trion/rendering`, and client application `@ar-trion/web-app`.
- **BIPA Consent Gate**: Implemented accessible [ClickwrapConsentModal.ts](file:///c:/Users/DELL/Stsack/POC-ARTRIOUT/packages/compliance/src/ClickwrapConsentModal.ts), stream guard `createProtectedCameraStream`, revocation handler `revokeClickwrapConsent`, and memory/localStorage stores in [ClickwrapConsent.ts](file:///c:/Users/DELL/Stsack/POC-ARTRIOUT/packages/compliance/src/ClickwrapConsent.ts).
- **Ephemeral Memory Sanitizer**: Extended [MemorySanitizer.ts](file:///c:/Users/DELL/Stsack/POC-ARTRIOUT/packages/compliance/src/MemorySanitizer.ts) with `EphemeralScratchPool`, `isBufferZeroed`, `isFrameSanitized`, and safe frame execution loop.
- **Edge-Only & Zero-Egress Architecture**: Implemented [LocalInferenceRuntime.ts](file:///c:/Users/DELL/Stsack/POC-ARTRIOUT/packages/perception/src/LocalInferenceRuntime.ts) and [NetworkEgressGuard.ts](file:///c:/Users/DELL/Stsack/POC-ARTRIOUT/packages/perception/src/NetworkEgressGuard.ts) to enforce zero network transmission of biometric geometry.
- **Perception Procurement**: Added Apache-2.0 [MediaPipeHandLandmarker.ts](file:///c:/Users/DELL/Stsack/POC-ARTRIOUT/packages/perception/src/MediaPipeHandLandmarker.ts) supporting offline task binaries.
- **WebGPU Toolchain**: Implemented [WebGPUCapabilityDetector.ts](file:///c:/Users/DELL/Stsack/POC-ARTRIOUT/packages/rendering/src/WebGPUCapabilityDetector.ts) with hard rejection of WebGL fallbacks, alongside [EmscriptenConfig.ts](file:///c:/Users/DELL/Stsack/POC-ARTRIOUT/packages/rendering/src/EmscriptenConfig.ts) and build scripts.
- **Local AI Orchestration**: Added multi-agent configuration in [.agents/workflows/local-ai-orchestration.json](file:///c:/Users/DELL/Stsack/POC-ARTRIOUT/.agents/workflows/local-ai-orchestration.json) and rule guide [.agents/rules/ai-orchestration.md](file:///c:/Users/DELL/Stsack/POC-ARTRIOUT/.agents/rules/ai-orchestration.md) connecting Google Antigravity & OmniRoute to Local LLM Studio at zero token cost.
- **Integrated Playwright & Matrix Testing**: Merged `jules-9947153505645523934-b6dceccd` containing [src/matrix.ts](file:///c:/Users/DELL/Stsack/POC-ARTRIOUT/src/matrix.ts), [tests/unit/matrix.test.ts](file:///c:/Users/DELL/Stsack/POC-ARTRIOUT/tests/unit/matrix.test.ts), [playwright.config.ts](file:///c:/Users/DELL/Stsack/POC-ARTRIOUT/playwright.config.ts), and [tests/bdd-playwright/mobile-interaction.spec.ts](file:///c:/Users/DELL/Stsack/POC-ARTRIOUT/tests/bdd-playwright/mobile-interaction.spec.ts).
- **Testing Infrastructure**: Comprehensive test suites in [tests/compliance.test.js](file:///c:/Users/DELL/Stsack/POC-ARTRIOUT/tests/compliance.test.js), [tests/zero-egress.test.js](file:///c:/Users/DELL/Stsack/POC-ARTRIOUT/tests/zero-egress.test.js), [tests/rendering.test.js](file:///c:/Users/DELL/Stsack/POC-ARTRIOUT/tests/rendering.test.js), [tests/sum.test.js](file:///c:/Users/DELL/Stsack/POC-ARTRIOUT/tests/sum.test.js), and [tests/unit/matrix.test.ts](file:///c:/Users/DELL/Stsack/POC-ARTRIOUT/tests/unit/matrix.test.ts). 22/22 tests passing.
