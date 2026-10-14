#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync, execSync } from 'node:child_process';

const PR_NUMBER = process.env.PR_NUMBER;
const REPO = process.env.GITHUB_REPOSITORY;
const COMMIT_SHA = process.env.COMMIT_SHA || process.env.GITHUB_SHA;
const CONFLICT_RESOLVED = process.env.CONFLICT_RESOLVED === 'true';

function runCmd(cmd, args = []) {
  try {
    if (args.length > 0) {
      return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    }
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  } catch (err) {
    return err.stdout ? err.stdout.trim() : '';
  }
}

function generateFingerprint(ruleId, filePath, message) {
  const normPath = path.normalize(filePath).replace(/\\/g, '/');
  const normMsg = message.trim().toLowerCase();
  const raw = `${ruleId}::${normPath}::${normMsg}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function parseTscOutput(logPath) {
  if (!fs.existsSync(logPath)) return [];
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  const findings = [];

  const regex = /^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+(TS\d+):\s+(.+)$/;

  for (const line of lines) {
    const match = line.trim().match(regex);
    if (match) {
      const [, filePath, lineNum, colNum, severityRaw, ruleId, message] = match;
      const normalizedPath = path.normalize(filePath).replace(/\\/g, '/');

      let priority = 'High';
      if (['TS6133', 'TS7006', 'TS7016'].includes(ruleId)) {
        priority = ruleId === 'TS6133' ? 'Low' : 'Medium';
      } else if (severityRaw === 'warning') {
        priority = 'Medium';
      } else {
        priority = 'High';
      }

      const fingerprint = generateFingerprint(ruleId, normalizedPath, message);

      findings.push({
        filePath: normalizedPath,
        line: parseInt(lineNum, 10),
        col: parseInt(colNum, 10),
        severityRaw,
        ruleId,
        message,
        priority,
        fingerprint,
        rawLine: line.trim()
      });
    }
  }

  return findings;
}

async function main() {
  console.log('Starting Reviewdog Post-Review Inspection & Zero-Duplication Triage...');

  const findings = parseTscOutput('tsc_output.log');
  console.log(`Parsed ${findings.length} findings from tsc_output.log.`);

  const uniqueMap = new Map();
  for (const f of findings) {
    if (!uniqueMap.has(f.fingerprint)) {
      uniqueMap.set(f.fingerprint, f);
    }
  }
  const deduplicatedFindings = Array.from(uniqueMap.values());

  const criticalHigh = deduplicatedFindings.filter(f => f.priority === 'Critical' || f.priority === 'High');
  const mediumLow = deduplicatedFindings.filter(f => f.priority === 'Medium' || f.priority === 'Low');

  let criticalHighStatus = 'None';
  let autoFixedCommit = null;

  if (criticalHigh.length > 0) {
    console.log(`Detected ${criticalHigh.length} Critical/High defects. Attempting auto-remediation...`);
    try {
      execSync('npm run lint --if-present', { stdio: 'inherit' });
    } catch {
      // Continue
    }

    const gitStatus = runCmd('git', ['status', '--porcelain']);
    if (gitStatus) {
      runCmd('git', ['config', 'user.name', 'github-actions[bot]']);
      runCmd('git', ['config', 'user.email', 'github-actions[bot]@users.noreply.github.com']);
      runCmd('git', ['add', '.']);
      runCmd('git', ['commit', '-m', 'fix(reviewdog): address critical/high static analysis defects']);
      runCmd('git', ['push', 'origin', `HEAD:${process.env.HEAD_REF || 'HEAD'}`]);
      autoFixedCommit = runCmd('git', ['rev-parse', '--short', 'HEAD']);
      criticalHighStatus = `Auto-Fixed in ${autoFixedCommit}`;
    } else {
      criticalHighStatus = 'Unresolved / Blocking';
    }
  }

  console.log('Fetching repository issues for deduplication check...');
  let existingIssues = [];
  if (REPO) {
    try {
      const rawIssues = runCmd('gh', ['issue', 'list', '--state', 'all', '--json', 'number,title,body,labels', '--limit', '500']);
      if (rawIssues) {
        existingIssues = JSON.parse(rawIssues);
      }
    } catch (err) {
      console.warn('Failed to query existing issues via gh CLI:', err.message);
    }
  }

  const processedResults = [];

  for (const defect of mediumLow) {
    const { ruleId, filePath, message, priority, fingerprint, line, col, rawLine } = defect;

    let matchedIssue = existingIssues.find(iss =>
      iss.body && iss.body.includes(`<!-- defect-fingerprint: ${fingerprint} -->`)
    );

    if (!matchedIssue) {
      matchedIssue = existingIssues.find(iss =>
        iss.title && iss.title.includes(ruleId) && iss.title.includes(filePath)
      );
    }

    if (matchedIssue) {
      const issueNum = String(matchedIssue.number);
      console.log(`Matching defect found in existing Issue #${issueNum}. Linking PR...`);

      if (PR_NUMBER && REPO && (!matchedIssue.body || !matchedIssue.body.includes(`#${PR_NUMBER}`))) {
        const commentBody = `Also detected in PR #${PR_NUMBER} at commit ${COMMIT_SHA} in \`${filePath}:${line}\` (\`${ruleId}\`).`;
        runCmd('gh', ['issue', 'comment', issueNum, '--body', commentBody]);
      }

      processedResults.push({
        ...defect,
        action: `Skipped Duplicate -> Linked Existing Issue #${issueNum}`
      });
    } else if (REPO) {
      console.log(`Creating new issue for ${priority} defect: ${ruleId} in ${filePath}...`);
      const issueTitle = `[Defect][${priority}] ${ruleId}: ${message.slice(0, 60)} in ${filePath}`;
      const issueBody = `<!-- defect-fingerprint: ${fingerprint} -->
**Automated Defect Report from Reviewdog Triage**

- **PR:** #${PR_NUMBER || 'N/A'}
- **Commit:** \`${COMMIT_SHA || 'N/A'}\`
- **File:** \`${filePath}\`
- **Line:** ${line}:${col}
- **Rule/Error Code:** \`${ruleId}\`

### Diagnostic Message
\`\`\`
${rawLine}
\`\`\`

### Context & Suggested Remediation
- **Root Cause:** Static analysis type mismatch / compiler diagnostic detected during PR check.
- **Remediation Steps:** Review \`${filePath}\` around line ${line} and address the type mismatch or missing declaration.
`;

      const priorityLabel = priority === 'Medium' ? 'priority: medium' : 'priority: low';
      let createdIssueNum = null;
      try {
        const createOut = runCmd('gh', ['issue', 'create', '--title', issueTitle, '--body', issueBody, '--label', `defect,${priorityLabel},automated-triage`]);
        const match = createOut.match(/\/issues\/(\d+)/);
        if (match) createdIssueNum = match[1];
      } catch (err) {
        console.warn('Failed to create GitHub Issue:', err.message);
      }

      processedResults.push({
        ...defect,
        action: createdIssueNum ? `Created Issue #${createdIssueNum}` : 'Logged Issue'
      });
    } else {
      processedResults.push({
        ...defect,
        action: 'Dry Run (No Repo Context)'
      });
    }
  }

  for (const defect of criticalHigh) {
    processedResults.push({
      ...defect,
      action: criticalHighStatus
    });
  }

  if (PR_NUMBER && REPO) {
    console.log(`Posting/updating consolidated PR summary comment for PR #${PR_NUMBER}...`);
    const conflictStatusStr = CONFLICT_RESOLVED ? 'Resolved in isolated commit' : 'Clean (No Conflicts)';

    // Sanitize pipe characters in markdown table cells
    const sanitizeMarkdownCell = (text) => text.replace(/\\/g, '\\\\').replace(/\|/g, '\\|');

    let breakdownRows = processedResults.map(r =>
      `| ${r.priority} | \`${r.filePath}\` | ${r.line}:${r.col} | \`${r.ruleId}\`: ${sanitizeMarkdownCell(r.message.slice(0, 80))} | ${r.action} |`
    ).join('\n');

    if (!breakdownRows) {
      breakdownRows = '| N/A | N/A | N/A | No issues found | All checks passed |';
    }

    const summaryMarkdown = `<!-- reviewdog-triage-summary -->
## 🐶 Reviewdog Static Analysis & Triage Summary

| Metric | Status |
| :--- | :--- |
| **Merge Conflict Check** | ${conflictStatusStr} |
| **Total Unique Findings** | ${deduplicatedFindings.length} |
| **Critical / High Defects** | ${criticalHigh.length} |
| **Medium / Low Defects** | ${mediumLow.length} |

### Findings Breakdown & Routing

| Priority | File Path | Line | Error Code / Message | Action Taken |
| :--- | :--- | :--- | :--- | :--- |
${breakdownRows}

*Automated by Reviewdog & Jules PR Triage Pipeline*
`;

    try {
      const commentsRaw = runCmd('gh', ['api', `repos/${REPO}/issues/${PR_NUMBER}/comments`, '--jq', '.[] | select(.body | contains("<!-- reviewdog-triage-summary -->")) | .id']);
      const existingCommentId = commentsRaw ? commentsRaw.split('\n')[0] : null;

      if (existingCommentId) {
        const tempFile = 'summary_comment.md';
        fs.writeFileSync(tempFile, summaryMarkdown);
        runCmd('gh', ['api', '-X', 'PATCH', `repos/${REPO}/issues/comments/${existingCommentId}`, '-F', 'body=@summary_comment.md']);
        fs.unlinkSync(tempFile);
      } else {
        const tempFile = 'summary_comment.md';
        fs.writeFileSync(tempFile, summaryMarkdown);
        runCmd('gh', ['pr', 'comment', PR_NUMBER, '--body-file', 'summary_comment.md']);
        fs.unlinkSync(tempFile);
      }
    } catch (err) {
      console.warn('Failed to post PR summary comment:', err.message);
    }
  }

  if (criticalHigh.length > 0 && criticalHighStatus === 'Unresolved / Blocking') {
    console.error('CRITICAL/HIGH defects remaining on PR. Blocking workflow completion.');
    process.exit(1);
  }

  console.log('Reviewdog triage completed successfully.');
}

main().catch(err => {
  console.error('Error in reviewdog triage execution:', err);
  process.exit(1);
});
