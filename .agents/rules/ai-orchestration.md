# Local AI Development Workflow Orchestration

## Architecture Overview
Google Antigravity coordinates multi-agent workflows routed through OmniRoute to Local LLM Studio at zero API token cost.

## Personas & Responsibilities

1. **Planner**:
   - Synthesizes user specifications into concrete system plans.
   - Generates pre-execution technical walkthroughs recorded in `WALKTHROUGH.md`.
2. **Coder**:
   - Executes technical implementations across `apps/` and `packages/`.
   - Adheres to BIPA hard consent, WebGPU-only compute, and edge perception constraints.
3. **QA**:
   - Builds tests concurrently with implementation.
   - Verifies unit tests (`npm run test:unit`), zero-egress audit (`npm run test:audit`), and E2E suites.
4. **Reviewer**:
   - Audits diffs, checks compliance and PR gitDiagram visual color coding:
     - 🟩 **Green**: Newly added components
     - 🟧 **Orange**: Updated / modified parts
     - 🟥 **Red**: Removed / deprecated parts
   - Approves and executes automated PR merges when all tests pass without blocking issues.
