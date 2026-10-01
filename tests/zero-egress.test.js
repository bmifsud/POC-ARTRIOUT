import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  perceptionContracts,
  NetworkEgressGuard,
  LocalInferenceRuntime,
  MediaPipeHandLandmarker,
  MEDIAPIPE_DEFAULT_OFFLINE_CONFIG
} from '../packages/perception/src/index.ts';

test('PerceptionContracts: requires local-only and zero-egress', () => {
  assert.strictEqual(perceptionContracts.execution, 'local-only');
  assert.strictEqual(perceptionContracts.networkPolicy, 'zero-egress');
  assert.deepStrictEqual(perceptionContracts.allowedRuntimes, [
    'onnxruntime-web',
    'litert',
    '@xenova/transformers'
  ]);
});

test('LocalInferenceRuntime: rejects remote model downloads', () => {
  assert.throws(
    () => {
      new LocalInferenceRuntime({
        runtime: 'onnxruntime-web',
        localModelPath: 'https://cdn.example.com/models/hand.onnx',
        allowRemoteModelDownload: false
      });
    },
    /Edge Security Violation: Remote model URL/
  );

  assert.throws(
    () => {
      new LocalInferenceRuntime({
        runtime: 'litert',
        localModelPath: './models/hand.tflite',
        allowRemoteModelDownload: true
      });
    },
    /Edge Security Violation: allowRemoteModelDownload must be false/
  );
});

test('LocalInferenceRuntime: runs inference locally without network access', async () => {
  const runtime = new LocalInferenceRuntime({
    runtime: 'onnxruntime-web',
    localModelPath: './assets/models/hand_landmarker.onnx',
    allowRemoteModelDownload: false
  });

  await runtime.initialize();
  assert.strictEqual(runtime.isReady(), true);

  const dummyFrame = new Uint8ClampedArray(1280 * 720 * 4);
  const result = await runtime.inferGeometry(dummyFrame);

  assert.strictEqual(result.handedness, 'right');
  assert.strictEqual(result.landmarks.length, 21);
  assert.ok(result.confidence > 0.9);

  const report = NetworkEgressGuard.getReport();
  assert.strictEqual(report.violationCount, 0);
});

test('NetworkEgressGuard: intercepts and records outbound network attempts', () => {
  NetworkEgressGuard.activate();

  assert.throws(
    () => {
      NetworkEgressGuard.enforceZeroEgress('https://telemetry.analytics.io/events', 'POST');
    },
    /Zero-Egress Security Violation/
  );

  const report = NetworkEgressGuard.getReport();
  assert.strictEqual(report.violationCount, 1);
  assert.strictEqual(report.violations[0].url, 'https://telemetry.analytics.io/events');

  NetworkEgressGuard.reset();
});

test('MediaPipeHandLandmarker: offline asset contracts and palm detector procurement', async () => {
  assert.ok(MEDIAPIPE_DEFAULT_OFFLINE_CONFIG.handLandmarkerBinaryPath.endsWith('.task'));
  assert.ok(MEDIAPIPE_DEFAULT_OFFLINE_CONFIG.palmDetectorBinaryPath.endsWith('.task'));

  const landmarker = new MediaPipeHandLandmarker();
  await landmarker.initialize();

  const dummyFrame = new Uint8ClampedArray(640 * 480 * 4);
  const result = landmarker.detectForVideo(dummyFrame, 16.6);

  assert.strictEqual(result.landmarks[0].length, 21);
  assert.strictEqual(result.handedness[0].displayName, 'Right');
});
