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
<<<<<<< HEAD
  if (process.env.CI === 'true') {
    console.log('emcc not found in path. Simulating compilation and generating mock artifact for CI.');
    // Generate valid empty WebAssembly module
    const wasmMagicHeader = Buffer.from([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);
    fs.writeFileSync(path.resolve(rootDir, EMSCRIPTEN_WEBGPU_CONFIG.target), wasmMagicHeader);
    fs.writeFileSync(path.resolve(rootDir, EMSCRIPTEN_WEBGPU_CONFIG.target.replace('.wasm', '.js')), 'export function createARRendererModule() { return {}; }');
  } else if (process.env.NODE_ENV === 'production') {
    const targetWasm = path.resolve(rootDir, EMSCRIPTEN_WEBGPU_CONFIG.target);
    if (fs.existsSync(targetWasm)) {
      console.log('emcc not found in path, but production artifact already exists. Proceeding.');
    } else {
      console.error('emcc not found in path, and production artifact is missing. Failing build.');
      process.exit(1);
    }
  } else {
    console.error('emcc not found in path. Failing build to ensure valid artifact is generated.');
=======
  const targetPath = path.resolve(rootDir, EMSCRIPTEN_WEBGPU_CONFIG.target);
  if (process.env.NODE_ENV === 'production') {
    const wasmPath = targetPath.endsWith('.wasm') ? targetPath : targetPath.replace(/\.js$/, '.wasm');
    const jsPath = targetPath.endsWith('.wasm') ? targetPath.replace(/\.wasm$/, '.js') : targetPath;

    if (!fs.existsSync(jsPath) || !fs.existsSync(wasmPath)) {
      console.error('emcc not found in path and no prebuilt artifact exists. Both JS and WASM artifacts are required for production builds.');
      process.exit(1);
    } else if (fs.statSync(wasmPath).size <= 8) {
      console.error('emcc not found in path and prebuilt wasm artifact is too small (CI placeholder). A valid artifact is required for production builds.');
      process.exit(1);
    } else {
      console.log('emcc not found, but valid prebuilt artifacts exist. Proceeding with production build.');
    }
  } else if (process.env.CI === 'true' || process.env.MOCK_WASM_FOR_TESTS === 'true') {
    console.log('emcc not found in path (CI mode). Simulating compilation and generating mock artifact.');
    const minimalWasmBinary = Buffer.from([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);
    const wasmTarget = targetPath.endsWith('.wasm') ? targetPath : targetPath.replace(/\.js$/, '.wasm');
    const jsTarget = targetPath.endsWith('.wasm') ? targetPath.replace(/\.wasm$/, '.js') : targetPath;
    fs.writeFileSync(wasmTarget, minimalWasmBinary);
    fs.writeFileSync(jsTarget, 'export default function createARRendererModule() { return {}; }');
  } else {
    console.error('emcc not found in path. A valid emcc installation is required outside of CI/production environments.');
>>>>>>> origin/main
    process.exit(1);
  }
}

console.log('Compiler ready for native Emscripten execution.');
