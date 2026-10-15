# Skill Adapter: Review Change (`review-change`)

This skill definition outlines the protocol for code review and PR diff auditing.

## Policy Reference
Code reviews must verify adherence to **[AGENTS.md](../../../AGENTS.md)**.

## Review Audit Checklist
1. **Invariant Inspection**: Confirm no BIPA, zero-egress, memory sanitization, or WebGPU rules were violated.
2. **No Weakened Tests**: Ensure existing tests were not disabled, bypassed, or suppressed.
3. **Visual Color Coding**: Ensure review summary uses visual diff representation:
   - 🟩 **Green**: Newly added components
   - 🟧 **Orange**: Updated / modified parts
   - 🟥 **Red**: Removed / deprecated parts
4. **CI Security Check**: Ensure workflow permissions are least-privilege (`contents: read`) and actions are SHA-pinned.
