# Production CI/CD Governance and Google Jules Integration

This document outlines the architecture, workflow implementations, GitHub Actions reference breakdown, and security guardrails for integrating Google Jules (`google-github-actions/jules-action`) across automated tasks in this repository.

---

## 1. Google Jules Architecture Overview

Google Jules operates as an asynchronous AI coding agent for issue triage, automated bug fixes, CI remediation, performance optimization, and codebase maintenance:

* **Isolated Cloud Sandbox**: Each task executes inside an ephemeral VM with the repository cloned.
* **Deep Context Window**: Reads repository dependency graphs, configuration manifests, and multi-file structures across TypeScript, C/C++, WebAssembly, and build scripts.
* **Plan-First Iteration**: Formulates a step-by-step modification plan, executes changes across files, and runs local test suites and linters directly in the VM.
* **Automated Remediation and PR Creation**: If tests pass, Jules submits a verified pull request or updates the target branch with clean fixes.

---

## 2. Required Repository Secrets & Authorization Setup

To enable Jules workflows in GitHub Actions, configure the following:

1. **Jules Authorization**: Ensure the repository has installed the Google Labs Jules GitHub App via [jules.google.com](https://jules.google.com).
2. **Repository Secret Registration**:
   - Generate an API key in your Jules Settings.
   - Navigate to **Settings -> Secrets and variables -> Actions** in your GitHub repository.
   - Add a repository secret named `JULES_API_KEY` with your API key value.
3. **GitHub Token Permission**:
   - Workflows pass `${{ secrets.GITHUB_TOKEN }}` to `google-github-actions/jules-action` for pull request creation and issue labeling. Ensure workflow permissions include necessary privileges (`contents: write`, `issues: write`, `pull-requests: write`).

---

## 3. Implemented Jules Workflows (`.github/workflows/`)

The following workflows are configured under `.github/workflows/`:

### 1. Bug Fixer (`.github/workflows/bug-fixer.yml`)
* **Trigger**: `issues` (`opened`, `labeled` with `bug` or `jules:fix`).
* **Action**: `google-github-actions/jules-action@v1`
* **Purpose**: Automatically analyzes reported bugs, reproduces issues in tests, applies minimal fixes, and submits a pull request.

### 2. CI Failure Remediation (`.github/workflows/ci-failure-fix.yml` & `.github/workflows/jules-ci-healing.yml`)
* **Trigger**: `workflow_run` completion on failure of core Continuous Integration.
* **Action**: `google-github-actions/jules-action@v1`
* **Purpose**: Analyzes failing build/test logs, reproduces failures, applies minimal remediation, and opens a fix pull request.

### 3. Performance Improver (`.github/workflows/performance-improver.yml`)
* **Trigger**: `issues` or `pull_request` labeled with `performance` or `jules:opt`.
* **Action**: `google-github-actions/jules-action@v1`
* **Purpose**: Identifies and optimizes performance bottlenecks in WebGPU rendering, memory allocation, or ML inference loops without compromising BIPA zero-retention compliance.

### 4. Unblocked Issues Resolver (`.github/workflows/unblocked-issues.yml`)
* **Trigger**: `issues` (`unlabeled` when `blocked` label is removed).
* **Action**: `google-github-actions/jules-action@v1`
* **Purpose**: Resumes work on unblocked tasks, implements required logic, and submits a pull request once tests pass.

### 5. Weekly Codebase Cleanup (`.github/workflows/weekly-cleanup.yml`)
* **Trigger**: `schedule` (Weekly on Sunday at midnight `0 0 * * 0`) or `workflow_dispatch`.
* **Action**: `google-github-actions/jules-action@v1`
* **Purpose**: Conducts routine dead code removal, lint/formatting cleanup, and dependency health checks.

---

## 4. Operational Security & Governance Guardrails

All workflows adhere to strict enterprise security guardrails:

1. **Egress Network Filtering**: `step-security/harden-runner` runs as the mandatory first step in every job with `egress-policy: audit`.
2. **Least Privilege Permissions**: Workflows declare `permissions: contents: read` globally, elevating permissions (`contents: write`, `issues: write`, `pull-requests: write`) only at the specific job level.
3. **SHA Pinning**: All third-party GitHub Actions are pinned to immutable 40-character commit SHAs with semantic version comments.
4. **Concurrency Control**: Concurrency groups automatically cancel redundant pending runs to conserve runner minutes.
5. **BIPA & Zero-Egress Preservation**: Jules prompts enforce strict adherence to BIPA privacy controls, clickwrap consent hard gating, and zero-egress network policies.
