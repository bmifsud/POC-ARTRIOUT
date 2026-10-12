import { execSync } from 'child_process';

try {
  execSync('docker build -t ar-trion-test .', { stdio: 'inherit' });
  console.log('Docker build succeeded!');
} catch (e) {
  console.error('Docker build failed.');
}
