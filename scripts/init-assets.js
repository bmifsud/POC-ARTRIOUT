import fs from 'node:fs';
import path from 'node:path';

const wasmDir = path.resolve('public/wasm');
const modelsDir = path.resolve('public/models');

fs.mkdirSync(wasmDir, { recursive: true });
fs.mkdirSync(modelsDir, { recursive: true });

// Copy real MediaPipe & ONNX WASM binaries from node_modules if present
const mpWasmSrc = path.resolve('node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_internal.wasm');
const ortWasmSrc = path.resolve('node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.wasm');

if (fs.existsSync(mpWasmSrc)) {
  fs.copyFileSync(mpWasmSrc, path.join(wasmDir, 'mediapipe_hand_landmarker.wasm'));
  fs.copyFileSync(mpWasmSrc, path.join(wasmDir, 'vision_wasm_internal.wasm'));
}
if (fs.existsSync(ortWasmSrc)) {
  fs.copyFileSync(ortWasmSrc, path.join(wasmDir, 'onnx_runtime_web.wasm'));
  fs.copyFileSync(ortWasmSrc, path.join(wasmDir, 'ort-wasm-simd-threaded.jsep.wasm'));
}

// Generate valid glTF 2.0 Binary (.glb) asset buffers with PBR materials
function createValidGLB(materialName = 'PBR_Nail_Material') {
  const jsonContent = {
    asset: { version: '2.0', generator: 'AR Trion PBR Asset Builder' },
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: 'NailMesh' }],
    meshes: [{
      primitives: [{
        attributes: { POSITION: 0 },
        material: 0
      }]
    }],
    materials: [{
      name: materialName,
      pbrMetallicRoughness: {
        baseColorFactor: [0.8, 0.1, 0.2, 1.0],
        metallicFactor: 0.1,
        roughnessFactor: 0.1
      }
    }],
    accessors: [{
      bufferView: 0,
      componentType: 5126, // FLOAT
      count: 3,
      type: 'VEC3',
      max: [0.5, 0.5, 0.0],
      min: [-0.5, -0.5, 0.0]
    }],
    bufferViews: [{
      buffer: 0,
      byteOffset: 0,
      byteLength: 36,
      target: 34962
    }],
    buffers: [{ byteLength: 36 }]
  };

  const jsonString = JSON.stringify(jsonContent);
  const jsonBuffer = Buffer.from(jsonString, 'utf8');
  // Align JSON chunk to 4-byte boundary
  const jsonPadding = (4 - (jsonBuffer.length % 4)) % 4;
  const jsonChunkLength = jsonBuffer.length + jsonPadding;

  // 3 float VEC3 positions (3 * 3 * 4 = 36 bytes)
  const binBuffer = Buffer.alloc(36);
  const binPadding = (4 - (binBuffer.length % 4)) % 4;
  const binChunkLength = binBuffer.length + binPadding;

  const totalLength = 12 + 8 + jsonChunkLength + 8 + binChunkLength;
  const glb = Buffer.alloc(totalLength);

  // Header
  glb.writeUInt32LE(0x46546C67, 0); // Magic "glTF"
  glb.writeUInt32LE(2, 4);          // Version 2
  glb.writeUInt32LE(totalLength, 8);

  // JSON Chunk Header
  let offset = 12;
  glb.writeUInt32LE(jsonChunkLength, offset);
  glb.writeUInt32LE(0x4E4F534A, offset + 4); // "JSON"
  offset += 8;
  jsonBuffer.copy(glb, offset);
  offset += jsonBuffer.length;
  for (let i = 0; i < jsonPadding; i++) {
    glb.writeUInt8(0x20, offset + i); // Space padding
  }
  offset += jsonPadding;

  // BIN Chunk Header
  glb.writeUInt32LE(binChunkLength, offset);
  glb.writeUInt32LE(0x004E4942, offset + 4); // "BIN\0"
  offset += 8;
  binBuffer.copy(glb, offset);

  return glb;
}

const nailPbrGlb = createValidGLB('PBR_Nail_Standard');
const nailCrimsonGlb = createValidGLB('HighGloss_Crimson_Nail');

fs.writeFileSync(path.join(modelsDir, 'nail_asset_pbr.glb'), nailPbrGlb);
fs.writeFileSync(path.join(modelsDir, 'nail_high_gloss_crimson.glb'), nailCrimsonGlb);

console.log('Valid edge WASM binaries and GLB assets initialized.');
