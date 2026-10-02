# AR Trion (POC-ARTRIOUT)

High-performance, edge-only Augmented Reality web platform designed with enterprise-grade privacy and BIPA compliance, powered by WebGPU and local perception models.

## Repository Architecture

```
POC-ARTRIOUT/
├── apps/                  # End-user client applications
├── packages/
│   ├── compliance/        # BIPA consent gate, memory sanitization, & audit logging
│   ├── perception/        # Edge-only ML runtimes (MediaPipe, ONNX, Transformers.js)
│   └── rendering/         # WebGPU pipeline & shader execution (no WebGL fallback)
├── docs/                  # Architectural and compliance specifications
├── tests/                 # Unit, E2E, and zero-egress audit test suites
└── .github/               # CI/CD workflows and automation
```

## Core Tenets

1. **BIPA & Privacy Hard Gating**: The camera cannot be accessed or queried prior to affirmative consent recorded via `packages/compliance/src/ClickwrapConsent.ts`.
2. **Zero-Egress Edge Inference**: Biometric data and camera feeds never leave volatile linear memory.
3. **Ephemeral Memory Loops**: Buffers are forcefully sanitized using `packages/compliance/src/MemorySanitizer.ts`.
4. **Modern Graphics Acceleration**: Exclusively targets WebGPU for low-latency compute and rendering, rejecting legacy WebGL fallbacks.

## Development & Testing

- `npm run test:unit`: Executes native unit tests
- `npm run test:audit`: Validates zero-egress network policies
- `npm run test`: Runs BDD and end-to-end integration suites
- `npm run build`: Compiles all packages and application targets
