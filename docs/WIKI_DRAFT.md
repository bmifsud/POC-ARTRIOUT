# POC-ARTRIOUT Project Documentation Summary

## Overview
**POC-ARTRIOUT** is a high-performance, edge-only Augmented Reality (AR) web platform designed with enterprise-grade privacy and BIPA (Biometric Information Privacy Act) compliance. It is powered by WebGPU-accelerated local perception models.

## Core Tenets
1. **BIPA & Privacy Hard Gating**: Mandatory, recorded consent via `packages/compliance/src/ClickwrapConsent.ts` before camera access.
2. **Zero-Egress Edge Inference**: Biometric data and video streams are processed entirely within volatile, linear memory. Data never leaves the client.
3. **Ephemeral Memory Loops**: Strictly enforced memory sanitization using `packages/compliance/src/MemorySanitizer.ts`.
4. **Modern Graphics Acceleration**: Exclusively targets WebGPU for low-latency compute; legacy WebGL fallbacks are intentionally rejected to maintain performance and security posture.

## Architectural Structure
```text
POC-ARTRIOUT/
├── apps/                  # End-user client applications
├── packages/
│   ├── compliance/        # BIPA consent gate, memory sanitization, & audit logging
│   ├── perception/        # Edge-only ML runtimes (MediaPipe, ONNX, Transformers.js)
│   └── rendering/         # WebGPU pipeline & shader execution
├── docs/                  # Architectural and compliance specifications
├── tests/                 # Unit, E2E, and zero-egress audit test suites
└── .github/               # CI/CD workflows and automation
```

## Developer Workflow & Testing
* **`npm run test:unit`**: Executes native unit tests for individual packages.
* **`npm run test:audit`**: Validates zero-egress network policies (ensures no data leaves the browser).
* **`npm run test`**: Runs Behavior-Driven Development (BDD) and full end-to-end integration suites.
* **`npm run build`**: Compiles all packages and application targets.
