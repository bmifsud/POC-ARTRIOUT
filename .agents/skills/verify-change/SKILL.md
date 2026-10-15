# Skill Adapter: Verify Change (`verify-change`)

This skill definition outlines the protocol for verifying code and workflow quality before committing changes.

## Policy Reference
Verification steps must fulfill the QA and governance requirements specified in **[AGENTS.md](../../../AGENTS.md)**.

## Verification Checklist
1. **Linting Check**: Run `npm run lint` to verify static analysis compliance.
2. **Unit Test Suite**: Execute `npm run test:unit` to run all unit tests across monorepo packages.
3. **Zero-Egress Audit**: Execute `npm run test:audit` to ensure zero remote transmission of camera/biometric data.
4. **Coverage & Gate Verification**: Execute `npm run test:gate` to verify >= 80% code coverage.
5. **Python/Workflow Verification**: Execute `python3 -m pytest tests/ci/test_workflow_concurrency.py` and `python3 -m unittest discover tests/`.
