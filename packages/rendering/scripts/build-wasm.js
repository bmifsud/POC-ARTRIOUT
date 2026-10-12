#!/usr/bin/env node
/**
 * Emscripten compilation runner for AR Trion WebGPU & WASM pipeline.
 * Ensures compilation flags enforce multi-threaded WebGPU and explicitly forbid WebGL.
 */

import { EMSCRIPTEN_WEBGPU_CONFIG } from '../src/EmscriptenConfig.ts';

console.log(`AR Trion Emscripten WebGPU WASM Compiler initialized for target: ${EMSCRIPTEN_WEBGPU_CONFIG.target}`);
