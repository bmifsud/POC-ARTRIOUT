import fs from 'node:fs';
import path from 'node:path';

const SUMMARY_PATH = path.resolve('coverage/coverage-summary.json');
const THRESHOLD = 80;

if (!fs.existsSync(SUMMARY_PATH)) {
  console.error(`Coverage summary file not found at ${SUMMARY_PATH}`);
  process.exit(1);
}

try {
  const content = fs.readFileSync(SUMMARY_PATH, 'utf8');
  const summary = JSON.parse(content);

  const total = summary.total;
  if (!total) {
    console.error('Invalid coverage summary format: "total" key missing.');
    process.exit(1);
  }

  const statements = total.statements?.pct ?? 0;
  const lines = total.lines?.pct ?? 0;
  const functions = total.functions?.pct ?? 0;
  const branches = total.branches?.pct ?? 0;

  console.log('--- Code Coverage Summary ---');
  console.log(`Statements: ${statements}% (Threshold: ${THRESHOLD}%)`);
  console.log(`Lines:      ${lines}% (Threshold: ${THRESHOLD}%)`);
  console.log(`Functions:  ${functions}% (Threshold: ${THRESHOLD}%)`);
  console.log(`Branches:   ${branches}% (Informational)`);
  console.log('-----------------------------');

  const failures = [];
  if (statements < THRESHOLD) {
    failures.push(`Statements coverage (${statements}%) is below required threshold (${THRESHOLD}%).`);
  }
  if (lines < THRESHOLD) {
    failures.push(`Lines coverage (${lines}%) is below required threshold (${THRESHOLD}%).`);
  }
  if (functions < THRESHOLD) {
    failures.push(`Functions coverage (${functions}%) is below required threshold (${THRESHOLD}%).`);
  }

  if (failures.length > 0) {
    console.error('\nCoverage Verification Failed:');
    failures.forEach((f) => console.error(` - ${f}`));
    process.exit(1);
  }

  console.log('\nCoverage Verification Passed!');
  process.exit(0);
} catch (error) {
  console.error(`Error reading or parsing coverage summary: ${error.message}`);
  process.exit(1);
}
