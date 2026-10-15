# Authoritative AI Agent Policy & Repository Governance

This document serves as the single source of truth for all AI agent behaviors, multi-agent orchestrations, code changes, and CI/CD governance across the AR Trion monorepo.

---

## 1. Product & Security Invariants (Non-Negotiable)

1. **BIPA-Compliant Consent Gate**:
   - Explicit clickwrap consent (`ClickwrapConsent.ts`) must be granted before camera initialization or video stream capture (`createProtectedCameraStream`).
   - Revocation (`revokeClickwrapConsent`) must instantly stop all active `MediaStreamTrack` instances.

2. **Edge-Only Local Processing Contract**:
   - All ML inference runtimes (ONNX Runtime Web, LiteRT, MediaPipe) execute strictly on-device in browser memory.
   - Zero-egress network compliance (`NetworkEgressGuard.ts`) strictly intercepts and blocks any outbound network request carrying biometric or camera frame payloads.

3. **Ephemeral Memory Sanitization**:
   - Volatile RAM buffers (`Uint8ClampedArray`, `Float32Array`, landmark coordinate arrays) must be zeroed immediately upon frame cycle completion via `MemorySanitizer.purgeFrame()` or `createEphemeralFrameLoop()`.

4. **WebGPU-Only Compute & Rendering Budget**:
   - Rendering submodules enforce WebGPU execution (`WebGPUCapabilityDetector.ts`).
   - WebGL fallbacks are explicitly deprecated and rejected.
   - Real-time rendering routines must execute within a strict sub-16 ms (60 FPS) frame time budget.

5. **Test Preservation & Quality Standards**:
   - Existing tests must never be weakened, bypassed, disabled, or suppressed.
   - Local validation gate (`npm run test:gate`) requires >= 80% code coverage (`c8`) and zero network egress compliance.

---

## 2. CI/CD Governance & Concurrency Directives

1. **Least-Privilege Security Model**:
   - Workflow default permissions must be restricted to `contents: read`.
   - Elevate permissions (`contents: write`, `issues: write`, `pull-requests: write`, `security-events: write`, `id-token: write`) strictly at the job level.
   - Pin third-party GitHub Actions to 40-character commit SHAs.

2. **Shared Concurrency Mutex**:
   - All automated agent workflows must participate in a unified concurrency locking group prefixed with `pr-agent-`.
   - `concurrency.group`: `pr-agent-${{ github.event.pull_request.number || github.event.issue.number || github.ref }}`
   - `concurrency.cancel-in-progress`: `false`

3. **Bot Actor Circuit Breakers**:
   - All AI and PR mutating jobs must enforce bot rejection at the job-level `if` condition:
     `!endsWith(github.actor, '[bot]') && github.actor != 'github-actions[bot]'`

4. **Explicit Label Gating & Consumption**:
   - Workflows must be gated by explicit labels (`ai-fix`, `autorebase`, `resolve-conflicts`).
   - Triggering labels must be consumed (removed) immediately upon execution step invocation.

---

## 3. Agent Roles & Multi-Agent Orchestration

- **Planner**: Formulates structured, step-by-step modification plans and maintains technical implementation records in `WALKTHROUGH.md`.
- **Coder**: Implements TypeScript and C++/WASM logic adhering strictly to compliance and rendering performance constraints.
- **QA**: Builds unit and E2E tests, verifying linting (`npm run lint`), unit tests (`npm run test:unit`), zero-egress audit (`npm run test:audit`), and coverage thresholds (`npm run test:gate`).
- **Reviewer**: Audits git diffs for architectural compliance, verifies test coverage, and checks PR visual color coding:
  - 🟩 **Green**: Newly added components
  - 🟧 **Orange**: Updated / modified parts
  - 🟥 **Red**: Removed / deprecated parts
