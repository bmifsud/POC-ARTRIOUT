import fs from 'fs';
import path from 'path';

const SUMMARY_PATH = path.resolve('coverage/coverage-summary.json');
const THRESHOLD = 80;

if (!fs.existsSync(SUMMARY_PATH)) {
  console.error(`Error: Coverage summary file not found at ${SUMMARY_PATH}`);
  process.exit(1);
}

const summary = JSON.parse(fs.readFileSync(SUMMARY_PATH, 'utf8'));
const total = summary.total;

if (!total) {
  console.error('Error: "total" section missing in coverage summary.');
  process.exit(1);
}

const metrics = ['statements', 'lines', 'functions'];
let failed = false;

console.log('--- Automated QA Coverage Verification ---');
for (const metric of metrics) {
  const pct = total[metric] ? total[metric].pct : 0;
  console.log(`${metric.toUpperCase()} coverage: ${pct}% (Required: ${THRESHOLD}%)`);
  if (pct < THRESHOLD) {
    console.error(`FAILURE: ${metric} coverage (${pct}%) is below the minimum threshold of ${THRESHOLD}%.`);
    failed = true;
  }
}

if (failed) {
  console.error('Automated QA Gate Failed: Minimum code coverage requirements not met.');
  process.exit(1);
}

console.log('Automated QA Gate Passed: All code coverage thresholds satisfied.');
process.exit(0);
