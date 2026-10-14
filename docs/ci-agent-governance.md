# CI Agent Governance Specification

## Overview
This document defines the repository-wide Pull Request (PR) and issue automation agent contract. To prevent race conditions, infinite recursive commit loops, and resource contention between automated agent workflows, all PR mutators and autonomous agent workflows must strictly adhere to shared concurrency locks, bot actor circuit breakers, explicit label gating, and label consumption mechanisms.

## Contract Directives

### 1. Shared Concurrency Mutex
All AI and PR mutator workflows must participate in a unified concurrency locking group prefixed with `pr-agent-`.
- **Group Pattern:**
  `group: pr-agent-${{ github.event.pull_request.number || github.event.issue.number || github.event.workflow_run.pull_requests[0].number || github.ref }}`
- **Cancellation Policy:**
  `cancel-in-progress: false` to ensure in-flight agent actions complete predictably without leaving corrupted or intermediate git states.

### 2. Bot Circuit Breaker
To prevent recursive agent invocation loops triggered by bot actions, all workflows must reject bot actors at the job level `if` condition.
- **Circuit Breaker Condition:**
  `!endsWith(github.actor, '[bot]') && github.actor != 'github-actions[bot]'`

### 3. Explicit Label Gates and Consumption
Workflows that make automated modifications to branches, PRs, or issues must be gated by explicit labels and consume their triggering label immediately upon execution:

- **`autorebase.yml`**:
  - Gated by `autorebase` or `ai-fix` label AND non-draft PR state:
    `github.event.pull_request.draft == false && (contains(github.event.pull_request.labels.*.name, 'autorebase') || contains(github.event.pull_request.labels.*.name, 'ai-fix'))`

- **`conflict-resolver.yml`**:
  - Gated by `resolve-conflicts` or `ai-fix` label:
    `contains(github.event.pull_request.labels.*.name, 'resolve-conflicts') || contains(github.event.pull_request.labels.*.name, 'ai-fix')`
  - Label Consumption: Automatically removes `resolve-conflicts` after running via `gh pr edit "${{ github.event.pull_request.number }}" --remove-label "resolve-conflicts" || true`.

- **`jules-ci-healing.yml`**:
  - Gated by `ai-fix` label:
    `contains(github.event.pull_request.labels.*.name, 'ai-fix')`
  - Label Consumption: Automatically removes `ai-fix` label prior to running remediation via `gh pr edit --remove-label "ai-fix" || true`.

- **`qodo-defect-fixer.yml`**:
  - Gated by `ai-fix` label:
    `contains(github.event.pull_request.labels.*.name, 'ai-fix')`
  - Label Consumption: Automatically removes `ai-fix` label via `gh pr edit --remove-label "ai-fix" || true`.

- **`bug-fixer.yml`**:
  - Gated by `ai-fix` label:
    `contains(github.event.issue.labels.*.name, 'ai-fix')`
  - Label Consumption: Automatically removes `ai-fix` label via `gh issue edit --remove-label "ai-fix" || true`.
