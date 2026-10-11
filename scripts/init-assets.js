import fs from 'node:fs';
import path from 'node:path';

const wasmDir = path.resolve('public/wasm');
const modelsDir = path.resolve('public/models');

fs.mkdirSync(wasmDir, { recursive: true });
fs.mkdirSync(modelsDir, { recursive: true });

// Minimal WASM magic header (\0asm\1\0\0\0)
const wasmHeader = Buffer.from([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);

fs.writeFileSync(path.join(wasmDir, 'mediapipe_hand_landmarker.wasm'), wasmHeader);
fs.writeFileSync(path.join(wasmDir, 'onnx_runtime_web.wasm'), wasmHeader);

// Minimal glTF binary (glTF magic header: glTF + version 2)
const glbHeader = Buffer.from([0x67, 0x6c, 0x54, 0x46, 0x02, 0x00, 0x00, 0x00, 0x14, 0x00, 0x00, 0x00]);

fs.writeFileSync(path.join(modelsDir, 'nail_asset_pbr.glb'), glbHeader);
fs.writeFileSync(path.join(modelsDir, 'nail_high_gloss_crimson.glb'), glbHeader);

console.log('Public edge WASM and GLB assets initialized.');
