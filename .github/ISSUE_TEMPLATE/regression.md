---
name: "CI Regression / Issue Report"
about: "Report a pipeline regression or architectural constraint violation"
title: "CI Regression: Pipeline Failed"
labels: ["bug", "regression", "auto-fix"]
---

## CI/CD Pipeline Failure & Anomaly Report
A regression or system anomaly was identified during continuous integration or automated monitoring.

### 1. System Diagnostic Context
- **Workflow:** ${{ github.workflow }}
- **Run ID:** ${{ github.run_id }}
- **Commit SHA:** ${{ github.sha }}
- **Environment:** Isolated Node.js / Playwright WebGPU Runtime

### 2. Privacy & Compliance Audit Details
- **BIPA Ephemeral Memory Sanitization:** Verify `MemorySanitizer.ts` or `sanitizeFrame` was executed.
- **Zero-Egress Network Audit:** Verify `NetworkEgressGuard.ts` blocked all outbound camera / biometric payloads.

### 3. Performance & WebGPU Metrics
- **Frame Budget:** Sub-16 ms (60 FPS target) WebGPU pipeline execution.
- **Rendering Fallback Check:** Confirm WebGL contexts are strictly rejected.

### 4. Architectural Baseline Reference
- **Authoritative Model:** AR trion system model and multi-agent architecture baselines.

### 5. Detailed Error Logs & Repro Steps
Please attach relevant workflow runner logs, stack traces, and test output.
