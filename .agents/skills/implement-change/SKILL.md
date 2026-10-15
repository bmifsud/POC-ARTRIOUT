# Skill Adapter: Implement Change (`implement-change`)

This skill definition outlines the protocol for executing TypeScript, WebAssembly, or GitHub Actions code changes.

## Policy Reference
Implementation must strictly preserve all non-negotiable invariants defined in **[AGENTS.md](../../../AGENTS.md)**.

## Implementation Guidelines
1. **BIPA Compliance**: Wrap media stream access behind `ClickwrapConsent.ts` and `createProtectedCameraStream()`.
2. **Local-Only Egress Guard**: Ensure ML models are loaded from bundled local static assets (`public/models/`, `public/wasm/`).
3. **Memory Sanitization**: Zero frame buffers (`Uint8ClampedArray`) and biometric arrays (`Float32Array`) via `MemorySanitizer.purgeFrame()`.
4. **WebGPU Rendering**: Target WebGPU shaders (`pbr-nail.wgsl`). Do not introduce WebGL fallbacks. Maintain sub-16 ms rendering budgets.
