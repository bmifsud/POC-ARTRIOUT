import { NailExtractor } from "../../packages/perception/src/mediapipe/NailExtractor.js";
import { OcclusionMask } from "../../packages/perception/src/occlusion/OcclusionMask.js";
import assert from "assert";
import test from "node:test";

test("NailExtractor extracts 5 nails with surface normals and scale", () => {
  const extractor = new NailExtractor();
  const landmarks = Array.from({ length: 21 }, () => new Float32Array([0, 0, 0]));
  const { nails, surfaceNormals, scale } = extractor.extractNails(landmarks);
  assert.strictEqual(nails.length, 10);
  assert.strictEqual(surfaceNormals.length, 1);
  assert.strictEqual(scale, 1.0);
});

test("OcclusionMask generates correct mask based on curl and depth", () => {
  const mask = new OcclusionMask();
  const mcp = new Float32Array([0, 0, 0.5]);
  const wrist = new Float32Array([0, 0, 0]);
  assert.strictEqual(mask.generateMask(0.6, mcp, wrist), true);
});
