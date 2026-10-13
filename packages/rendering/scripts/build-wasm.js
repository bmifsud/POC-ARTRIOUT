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
     try {
       execSync(command, { stdio: 'inherit' });
     } catch (err) {
       console.error('Emscripten compilation failed.');
       process.exit(1);
     }
  } else {
     console.error('Source file not found!');
     process.exit(1);
  }
} else {
  const targetPath = path.resolve(rootDir, EMSCRIPTEN_WEBGPU_CONFIG.target);
  const wasmTarget = targetPath.endsWith('.wasm') ? targetPath : targetPath.replace(/\.js$/, '.wasm');
  const jsTarget = targetPath.endsWith('.wasm') ? targetPath.replace(/\.wasm$/, '.js') : targetPath;

  if (process.env.NODE_ENV === 'production' || process.env.RENDER === 'true') {
    if (!fs.existsSync(wasmTarget) || fs.statSync(wasmTarget).size <= 8) {
      console.error('emcc not found and no valid prebuilt artifact exists for production deployment. Compilation cannot proceed.');
      process.exit(1);
    } else {
      console.log('emcc not found, but prebuilt artifact exists. Proceeding with production build.');
    }
  } else if (process.env.CI === 'true' || process.env.MOCK_WASM_FOR_TESTS === 'true') {
    console.log('emcc not found in path (CI mode). Simulating compilation and generating mock artifact.');
    const minimalWasmBinary = Buffer.from([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);
    fs.writeFileSync(wasmTarget, minimalWasmBinary);
    fs.writeFileSync(jsTarget, 'export default function createARRendererModule() { return {}; }');
  } else {
    console.error('emcc not found. Emscripten is required for compilation outside of CI environments.');
    process.exit(1);
  }
}

console.log('Compiler ready for native Emscripten execution.');
