import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  renderingContracts,
  WebGPUCapabilityDetector,
  EMSCRIPTEN_WEBGPU_CONFIG
} from '../packages/rendering/src/index.ts';

test('RenderingContracts: verifies WebGPU requirement and volatile storage', () => {
  assert.strictEqual(renderingContracts.gpuApi, 'WebGPU');
  assert.strictEqual(
    renderingContracts.fallback,
    'Camera and perception must remain disabled without WebGPU'
  );
  assert.strictEqual(renderingContracts.dataLocation, 'volatile browser memory');
});

test('WebGPUCapabilityDetector: rejects environments without WebGPU', async () => {
  const mockNavigator = {};
  const report = await WebGPUCapabilityDetector.checkSupport(mockNavigator);

  assert.strictEqual(report.supported, false);
  assert.strictEqual(
    report.reason,
    'WebGPU is not supported on this browser or platform.'
  );

  await assert.rejects(
    async () => {
      await WebGPUCapabilityDetector.assertWebGPUReady(mockNavigator);
    },
    /WebGPU Initialization Failed/
  );
});

test('WebGPUCapabilityDetector: accepts compliant WebGPU adapter', async () => {
  const mockNavigator = {
    gpu: {
      async requestAdapter() {
        return {
          info: { device: 'NVIDIA RTX 4090 WebGPU' }
        };
      }
    }
  };

  const report = await WebGPUCapabilityDetector.checkSupport(mockNavigator);
  assert.strictEqual(report.supported, true);
  assert.strictEqual(report.adapterName, 'NVIDIA RTX 4090 WebGPU');
  assert.strictEqual(
    report.webGlDeprecatedNotice,
    'WebGL execution disabled. Running native WebGPU.'
  );
});

test('EmscriptenConfig: contains flags explicitly deprecating WebGL and enabling WebGPU & pthreads', () => {
  assert.ok(EMSCRIPTEN_WEBGPU_CONFIG.flags.includes('-s USE_WEBGPU=1'));
  assert.ok(EMSCRIPTEN_WEBGPU_CONFIG.flags.includes('-s USE_PTHREADS=1'));
  assert.ok(EMSCRIPTEN_WEBGPU_CONFIG.flags.includes('-s NO_WEBGL=1'));
  assert.ok(EMSCRIPTEN_WEBGPU_CONFIG.flags.includes('-s DEPRECATE_WEBGL=1'));
});
