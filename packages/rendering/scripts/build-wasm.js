/**
 * Emscripten compilation runner for AR Trion WebGPU & WASM pipeline.
 * Ensures compilation flags enforce multi-threaded WebGPU and explicitly forbid WebGL.
 */

import { EMSCRIPTEN_WEBGPU_CONFIG } from '../src/EmscriptenConfig.ts';
import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..', '..');

console.log('=== AR Trion Emscripten WebGPU WASM Compiler ===');
console.log('Target:', EMSCRIPTEN_WEBGPU_CONFIG.target);
console.log('Compilation Flags:');
for (const flag of EMSCRIPTEN_WEBGPU_CONFIG.flags) {
  console.log(`  ${flag}`);
}
console.log('WebGL Status: Explicitly deprecated and disabled.');

// We mock emcc if it's not present because CI environments don't have emscripten installed in this project setup.
const hasEmcc = (() => {
  try {
    execSync('which emcc', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
})();

const targetDir = path.dirname(path.resolve(rootDir, EMSCRIPTEN_WEBGPU_CONFIG.target));
fs.mkdirSync(targetDir, { recursive: true });

if (hasEmcc) {
  console.log('Running real emcc compilation...');
  const cppFile = path.resolve(__dirname, '../src/cpp/ar_renderer.cpp');
  if (fs.existsSync(cppFile)) {
     const command = `emcc ${cppFile} -o ${EMSCRIPTEN_WEBGPU_CONFIG.target} ${EMSCRIPTEN_WEBGPU_CONFIG.flags.join(' ')}`;
     execSync(command, { stdio: 'inherit' });
  } else {
     console.error('Source file not found!');
     process.exit(1);
  }
} else {
  const targetPath = path.resolve(rootDir, EMSCRIPTEN_WEBGPU_CONFIG.target);
  const wasmPath = targetPath.replace('.js', '.wasm');
  if (process.env.NODE_ENV === 'production') {
    if (!fs.existsSync(targetPath) || !fs.existsSync(wasmPath) || fs.statSync(wasmPath).size <= 8) {
      console.error('emcc not found in path and no valid prebuilt artifact exists. A valid artifact is required for production builds.');
      process.exit(1);
    } else {
      console.log('emcc not found, but prebuilt artifact exists. Proceeding with production build.');
    }
  } else if (process.env.MOCK_WASM_FOR_TESTS === 'true') {
    console.log('emcc not found in path (Mock mode). Simulating compilation and generating mock artifact.');
    const minimalWasmBinary = Buffer.from([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);
    fs.writeFileSync(wasmPath, minimalWasmBinary);
    fs.writeFileSync(targetPath, 'export default function createARRendererModule() { return {}; }');
  } else {
    console.error('emcc not found in path. A valid emcc installation is required outside of CI/production environments.');
    process.exit(1);
  }
}

console.log('Compiler ready for native Emscripten execution.');
