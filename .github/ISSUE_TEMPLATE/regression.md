---
title: "CI Regression: Pipeline Failed"
labels: ["bug", "regression", "automated"]
---

## CI/CD Pipeline Failure Detected
A regression was identified during the automated testing pipeline run.

### Failed Workflow:
- Workflow: {{ env.GITHUB_WORKFLOW }}
- Run ID: {{ env.GITHUB_RUN_ID }}
- Commit: {{ env.GITHUB_SHA }}

Please investigate the logs to resolve the regression, particularly checking BIPA compliance (zero-egress audits) and unit test failures.
