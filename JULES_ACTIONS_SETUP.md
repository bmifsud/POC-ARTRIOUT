# Production CI/CD Governance and Google Jules Integration

This document outlines the architecture, master configuration prompt, workflow templates, essential GitHub Actions reference breakdown, and security guardrails for integrating Google Jules alongside essential GitHub Actions.

---

## 1. Google Jules Architecture Overview

Google Jules operates as an asynchronous, headless AI coding agent. Unlike inline editor extensions that provide interactive autocomplete, Jules operates on ticket- and issue-driven tasks:

* **Isolated Cloud Sandbox**: Each task executes inside an ephemeral Google Cloud virtual machine (VM) with the repository cloned.
* **Deep Context Window**: Backed by Gemini 2.5 Pro (Free Tier) or Gemini 3 Pro (Paid Tiers), Jules reads repository dependency graphs, configuration manifests, and multi-file structures across languages including TypeScript, Python, Go, Rust, and Java.
* **Plan-First Iteration**: Before writing code, Jules formulates a step-by-step modification plan, executes changes across files, and runs local test suites and linters directly in the VM.
* **Automated Remediation and PR Creation**: If local tests fail, Jules analyzes diagnostic outputs, patches the edits, and submits a verified pull request.

---

## 2. Master Jules Prompt (Complete Governance & Self-Healing)

Copy and paste the following prompt into the Jules web interface ([jules.google.com](https://jules.google.com)), the Jules Tools CLI, or dispatch it programmatically via `google-labs-code/jules-invoke`:

```markdown
Act as a Principal Platform Security and DevOps Engineer. Analyze this repository's tech stack, package manifests, and existing workflows, then establish a hardened, production-grade GitHub Actions CI/CD, security governance baseline, and automated CI self-healing pipeline.

Implement or update our workflow definitions in .github/workflows/ according to the following exact specifications:
 * Pipeline Hardening and Runner Defense:
   * Add 'step-security/harden-runner' as the mandatory first step across every job in all workflows.
   * Configure it initially with 'egress-policy: audit'. Include commented domain allowlists preparing for 'egress-policy: block'.
   * Ensure all third-party actions across all workflow files are pinned to immutable 40-character commit SHAs with semantic version comments (e.g., uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2).
 * Security and Vulnerability Scanning Suite:
   * Implement Google OSV-Scanner ('google/osv-scanner-action') in a workflow triggered on pull requests and weekly schedule. Scan manifests/lockfiles recursively and upload results to SARIF/GitHub Security tab with 'fail-on-vuln: true'.
   * Implement GitHub CodeQL ('github/codeql-action') configured for our repository's detected programming languages on push to main and all pull requests.
   * Implement Secret Scanning via TruffleHog ('trufflesecurity/trufflehog') to inspect pull request diffs and commit histories for leaked credentials and tokens.
   * Implement OpenSSF Scorecard ('ossf/scorecard-action') on a weekly schedule to evaluate supply chain security posture.
 * Core CI and Build Matrix:
   * Scaffold a standard CI workflow covering build, linting, and automated unit testing matching our project language (using 'actions/setup-*' with caching enabled and 'actions/checkout').
   * Default all workflows to least-privilege permissions by setting top-level 'permissions: contents: read', granting explicit elevated permissions ('security-events: write', 'pull-requests: write') only on the specific jobs requiring them.
 * Release Automation:
   * Implement automated semantic releases using Google Release Please ('googleapis/release-please-action').
   * Configure it to track Conventional Commits on the primary branch, generate changelog entries, tag releases, and open release pull requests.
 * Automated CI Self-Healing Workflow:
   * Create a dedicated workflow (e.g., '.github/workflows/jules-ci-healing.yml') triggered on 'workflow_run' completion of our core Continuous Integration workflow.
   * Add a condition so this job only executes when 'github.event.workflow_run.conclusion == failure'.
   * Add strict anti-loop conditions ensuring the remediation agent never runs if the triggering commit or PR actor is 'google-labs-jules[bot]' or 'github-actions[bot]'.
   * Use 'google-labs-code/jules-invoke@v1' authenticated with '${{ secrets.JULES_API_KEY }}', setting 'starting_branch' to '${{ github.event.workflow_run.head_branch }}', and enabling 'include_last_commit' and 'include_commit_log'.
   * Direct the remediation agent in its prompt to reproduce the test/linter failure in its VM sandbox, implement the minimal fix, ensure all checks pass, and submit a remediation pull request targeting the failing branch.

Execution & Verification Steps:
 * Formulate a structured modification plan detailing all proposed file creations and edits in .github/workflows/.
 * Generate valid YAML adhering strictly to GitHub Actions syntax schemas.
 * Validate all YAML files locally for syntax validity.
 * Execute our existing project build and test suite to ensure no workflows conflict with local tooling.
 * Create a clean Git branch and submit a structured Pull Request summarizing each configured action, its security role, and next steps for the team.
```

---

## 3. Essential GitHub Actions Breakdown & Operational Matrix

Below is a breakdown of the essential GitHub Actions every modern, production-grade repository should implement:

### 1. Runner Security & Supply Chain Defense (The Zero-Trust Layer)
* **`step-security/harden-runner`**:
  * *Role*: eBPF-based runtime security and egress network filtering.
  * *Why it is essential*: Monitors GitHub Actions runners, alerts on unauthorized process modifications, and blocks malicious outbound connections using strict domain allowlists.
* **`google/osv-scanner-action`**:
  * *Role*: Software Composition Analysis (SCA) dependency auditing.
  * *Why it is essential*: Scans dependency manifests and lockfiles against the Open Source Vulnerabilities (OSV) database without running untrusted installation scripts, publishing SARIF reports directly to GitHub Security.
* **`github/codeql-action`**:
  * *Role*: Static Application Security Testing (SAST).
  * *Why it is essential*: Builds a semantic database of your codebase to trace untrusted inputs to execution sinks, catching SQL injection, XSS, and buffer overflows on pull requests.
* **`trufflesecurity/trufflehog`**:
  * *Role*: High-entropy secret scanning.
  * *Why it is essential*: Deeply inspects commit histories and pull request diffs for accidentally committed API keys, database credentials, and cryptographic certificates.
* **`ossf/scorecard-action`**:
  * *Role*: Supply chain security posture benchmark.
  * *Why it is essential*: Assesses your repository against OpenSSF security criteria (e.g., branch protections, pinned dependencies, token permissions, maintenance velocity) on a scheduled cadence.
* **`actions/dependency-review-action`**:
  * *Role*: Pull request dependency diff gatekeeper.
  * *Why it is essential*: Runs during pull requests to evaluate new packages added in manifest changes, blocking PRs introducing known CVEs or incompatible software licenses before merge.

### 2. Core CI & Build Foundations
* **`actions/checkout`**: Workspace retrieval (`persist-credentials: false` recommended).
* **`actions/setup-node` / `setup-python` / `setup-go` / `setup-java`**: Deterministic runtime provisioning with built-in caching.
* **`actions/cache`**: Artifact and dependency caching across workflow runs.
* **`actions/upload-artifact` & `actions/download-artifact`**: Inter-job file exchange and artifact retention.

### 3. Release Engineering & Container Delivery
* **`googleapis/release-please-action`**: Semantic releases and automated changelog maintenance based on Conventional Commits.
* **`docker/build-push-action` & `docker/login-action`**: Container building, Buildx caching, and publication.
* **`softprops/action-gh-release`**: Attaching compiled assets, binaries, or SBOMs to GitHub releases.

### 4. Code Quality, Coverage & Repository Hygiene
* **`codecov/codecov-action`**: Test coverage tracking and PR coverage regression gating.
* **`actions/stale`**: Backlog triage and issue lifecycle management.

### 5. Autonomous Coding & AI Remediation
* **`google-labs-code/jules-invoke`**: Asynchronous AI agent dispatch for automated issue triage and CI failure remediation.

---

### Summary Matrix

| Operational Category | Recommended Action | Typical Trigger Event | Primary Output / Protection |
|---|---|---|---|
| Runner Defense | `step-security/harden-runner` | Every Job (steps: [1]) | Egress filtering, block data exfiltration |
| Workspace Setup | `actions/checkout` | Push, Pull Request | Git workspace retrieval |
| Runtime Config | `actions/setup-*` | Push, Pull Request | Pinned toolchains & cache warming |
| Secret Scanning | `trufflesecurity/trufflehog` | Pull Request, Push | Credential leak prevention |
| SCA Vulnerability | `google/osv-scanner-action` | Pull Request, Weekly Cron | Manifest vulnerability detection |
| SAST Security | `github/codeql-action` | Push (main), PR | Injection & code-flaw detection |
| PR Dependency Audit | `actions/dependency-review-action` | Pull Request | Blocks newly added malicious packages |
| Supply Chain Posture | `ossf/scorecard-action` | Weekly Cron | OpenSSF benchmark scoring |
| Coverage Gating | `codecov/codecov-action` | Pull Request | Code test coverage regression block |
| Release Management | `googleapis/release-please-action` | Push (main) | SemVer bump, automated changelog |
| AI Self-Healing | `google-labs-code/jules-invoke` | Workflow Failure (`workflow_run`) | Auto-repairs broken CI builds |

---

## 4. Key Workflow Configurations

### A. Jules CI Self-Healing Workflow (`.github/workflows/jules-ci-healing.yml`)

```yaml
name: Jules CI Self-Healing Agent

on:
  workflow_run:
    workflows: ["Continuous Integration"]
    types: [completed]

permissions:
  contents: read
  actions: read

jobs:
  auto-remediate:
    if: >
      github.event.workflow_run.conclusion == 'failure' &&
      github.event.workflow_run.actor.login != 'google-labs-jules[bot]' &&
      github.event.workflow_run.actor.login != 'github-actions[bot]'
    runs-on: ubuntu-latest
    steps:
      - name: Harden Runner Environment
        uses: step-security/harden-runner@05e31511f85b41b11d1cf0ef85d0992719546e2c # v2.21.0
        with:
          egress-policy: audit

      - name: Invoke Jules Auto-Remediation
        uses: google-labs-code/jules-invoke@v1
        with:
          jules_api_key: ${{ secrets.JULES_API_KEY }}
          starting_branch: ${{ github.event.workflow_run.head_branch }}
          include_last_commit: true
          include_commit_log: true
          prompt: |
            The Continuous Integration workflow failed on branch '${{ github.event.workflow_run.head_branch }}'.
            Remediation Tasks:
            1. Analyze the failing commit and identify the unit test, compilation, or lint failure.
            2. Re-run tests inside the cloud VM to verify the failure.
            3. Apply the minimal necessary patch to resolve the issue without altering existing public interfaces.
            4. Verify that all linters and tests pass clean in the VM.
            5. Submit a pull request targeting '${{ github.event.workflow_run.head_branch }}' titled 'fix(ci): automated remediation of build failure'.
```

### B. Dependency Auditing via Google OSV-Scanner (`.github/workflows/osv-scanner.yml`)

```yaml
name: Dependency Vulnerability Audit

on:
  pull_request:
  schedule:
    - cron: '0 12 * * 1'

permissions:
  contents: read
  security-events: write

jobs:
  audit-dependencies:
    runs-on: ubuntu-latest
    steps:
      - name: Harden Runner
        uses: step-security/harden-runner@05e31511f85b41b11d1cf0ef85d0992719546e2c # v2.21.0
        with:
          egress-policy: audit

      - name: Checkout Codebase
        uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2

      - name: Execute Google OSV-Scanner
        uses: google/osv-scanner-action/.github/workflows/osv-scanner-reusable.yml@v1.9.2
        with:
          scan-args: |-
            --recursive
            ./
          fail-on-vuln: true
```

### C. Release Engineering via Google Release Please (`.github/workflows/release.yml`)

```yaml
name: Release Governance

on:
  push:
    branches:
      - main

permissions:
  contents: write
  pull-requests: write

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - name: Harden Runner
        uses: step-security/harden-runner@05e31511f85b41b11d1cf0ef85d0992719546e2c # v2.21.0
        with:
          egress-policy: audit

      - name: Run Release Please
        id: release
        uses: googleapis/release-please-action@7987452d334254bdc0230f40a1b64ff13550b719 # v4.1.4
        with:
          release-type: node
          package-name: root-application
```

---

## 5. Mandatory Repository-Wide Security & Deployment Rules

1. **SHA Pinning**: Pin every third-party action using its immutable 40-character commit hash rather than mutable tags (e.g., `uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2`) to prevent upstream supply chain compromise.
2. **Least Privilege**: Declare `permissions: contents: read` globally at the top of each workflow file, granting elevated permissions (`security-events: write`, `pull-requests: write`, etc.) only on individual jobs that strictly require them.
3. **Concurrency Control**: Set `concurrency: group: ${{ github.workflow }}-${{ github.ref }}, cancel-in-progress: true` on CI jobs to automatically cancel redundant runs when new commits are pushed, saving runner minutes.
4. **Jules Authorization**: Ensure the repository has installed the Google Labs Jules GitHub App via [jules.google.com](https://jules.google.com).
5. **Repository Secret Registration**: Generate an API key in your Jules Settings and store it under Settings -> Secrets and variables -> Actions as `JULES_API_KEY`.
6. **Transitioning Harden-Runner**: Review initial workflow runs under `egress-policy: audit`. Once all approved domains are documented in `allowed-endpoints`, switch the policy to `egress-policy: block`.
7. **Branch Protections**: Require continuous integration checks and mandatory code reviews before any PR (whether authored by humans or Jules) can be merged into protected branches.
