import fs from 'node:fs';
import path from 'node:path';

const wasmDir = path.resolve('public/wasm');
const modelsDir = path.resolve('public/models');

fs.mkdirSync(wasmDir, { recursive: true });
fs.mkdirSync(modelsDir, { recursive: true });

// Minimal WASM magic header (\0asm\1\0\0\0)
const wasmHeader = Buffer.from([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);

const wasmFiles = ['mediapipe_hand_landmarker.wasm', 'onnx_runtime_web.wasm'];
for (const file of wasmFiles) {
  const filePath = path.join(wasmDir, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, wasmHeader);
  }
}

// Minimal glTF binary (glTF magic header: glTF + version 2)
const glbHeader = Buffer.from([0x67, 0x6c, 0x54, 0x46, 0x02, 0x00, 0x00, 0x00, 0x14, 0x00, 0x00, 0x00]);

const modelFiles = ['nail_asset_pbr.glb', 'nail_high_gloss_crimson.glb'];
for (const file of modelFiles) {
  const filePath = path.join(modelsDir, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, glbHeader);
  }
}

console.log('Public edge WASM and GLB assets verified/initialized.');
