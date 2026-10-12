#!/usr/bin/env bash
set -e

# Utility script to clean up merged branches locally and prune remote references.

MERGED_BRANCHES=(
  "ci-close-low-priority-issues-2023938946787274556"
  "ci/streamline-workflows-9699868485701279198"
  "feat/android-mobile-interface-14865788692682212913"
  "feat/auto-rebase-workflow-12940996873520540104"
  "feat/auto-resolve-conflicts-12425328714193088594"
  "feat/jules-action-integration-17963201303147222632"
  "feat/jules-actions-setup-and-governance-7404926191557922550"
  "feat/nail-lab-storefront-widget-13213663448069481459"
  "feat/nail-salon-deployment-ui-5369929512202846683"
  "feat/phase-1-final-vertical-slice-15362684043276418486"
  "feat/phase-1-nail-lab-poc-11881744834599869534"
  "feature/multi-agent-orchestration"
  "feature/prerequisites-progress"
  "feature/review-issue-pipeline-optimization-8319150795706842865"
  "fix/conflict-resolver-qodo-review-13920301559158011076"
  "fix/qodo-review-pr-49-defects-15831267924699464833"
  "fix/security-code-scanning-remediations-17431416468825025100"
  "fix/serve-bundled-widget-8025727964746954083"
  "fix/storefront-widget-test-runner-5513284395251160515"
  "fix/update-dockerfile-serve-command-6390444363735852439"
  "jules-15064579202751100969-2604f2db"
  "jules-6625063007869649798-672e5f8c"
  "jules-9947153505645523934-b6dceccd"
  "jules-9947153505645523934-b6dceccd-8283623544606307113"
  "refactor/hardening-decoupling-pipeline-opt-7146887625144337355"
)

echo "Deleting local merged branches if present..."
for branch in "${MERGED_BRANCHES[@]}"; do
  git branch -d "$branch" 2>/dev/null || true
done

echo "Pruning remote tracking references..."
git remote prune origin

echo "Merged branches cleanup complete."
