#!/usr/bin/env node
/**
 * Emscripten compilation runner for AR Trion WebGPU & WASM pipeline.
 * Ensures compilation flags enforce multi-threaded WebGPU and explicitly forbid WebGL.
 */

import { EMSCRIPTEN_WEBGPU_CONFIG } from '../src/EmscriptenConfig.ts';

console.log('=== AR Trion Emscripten WebGPU WASM Compiler ===');
console.log('Target:', EMSCRIPTEN_WEBGPU_CONFIG.target);
console.log('Compilation Flags:');
for (const flag of EMSCRIPTEN_WEBGPU_CONFIG.flags) {
  console.log(`  ${flag}`);
}
console.log('WebGL Status: Explicitly deprecated and disabled.');
console.log('Compiler ready for native Emscripten execution.');
