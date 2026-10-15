# Skill Adapter: Plan Change (`plan-change`)

This skill definition outlines the protocol for planning code and workflow changes in the AR Trion repository.

## Policy Reference
All planning activities must align with the authoritative repository policy in **[AGENTS.md](../../../AGENTS.md)**.

## Planning Protocol
1. **Scope Analysis**: Inspect Issue requirement specifications and current repository state (`package.json`, `.github/workflows/`, package source files).
2. **Impact Assessment**: Check affected packages (`packages/compliance`, `packages/perception`, `packages/rendering`, `apps/`).
3. **Walkthrough Documentation**: Write technical walkthrough steps into `WALKTHROUGH.md` before initiating major refactors.
4. **Pre-Commit Verification Planning**: Include explicit steps for testing (`npm run lint`, `npm run test:unit`, `npm run test:audit`).
