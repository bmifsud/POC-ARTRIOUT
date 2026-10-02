import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  POLICY_VERSION,
  MemoryConsentStore,
  grantClickwrapConsent,
  revokeClickwrapConsent,
  cameraConsentActive,
  createProtectedCameraStream,
  sanitizeFrame,
  isBufferZeroed,
  isFrameSanitized,
  createEphemeralFrameLoop,
  EphemeralScratchPool
} from '../packages/compliance/src/index.ts';

test('ClickwrapConsent: should grant consent and store audit attributes', async () => {
  const store = new MemoryConsentStore();
  const fixedDate = '2026-10-01T12:00:00.000Z';
  const record = await grantClickwrapConsent(store, 'user-123', () => fixedDate);

  assert.strictEqual(record.actor, 'user-123');
  assert.strictEqual(record.action, 'grant');
  assert.strictEqual(record.policyVersion, POLICY_VERSION);
  assert.strictEqual(record.grantedAt, fixedDate);
  assert.ok(record.id && record.id.length > 0);

  const stored = await store.get();
  assert.deepStrictEqual(stored, record);
  assert.strictEqual(cameraConsentActive(stored), true);
});

test('ClickwrapConsent: should be idempotent for identical policy version', async () => {
  const store = new MemoryConsentStore();
  const first = await grantClickwrapConsent(store, 'user-1', () => 'time-1');
  const second = await grantClickwrapConsent(store, 'user-2', () => 'time-2');

  assert.strictEqual(first.id, second.id);
  assert.strictEqual(second.actor, 'user-1');
});

test('ClickwrapConsent: cameraConsentActive should reject missing or outdated policy', () => {
  assert.strictEqual(cameraConsentActive(null), false);
  assert.strictEqual(
    cameraConsentActive({
      id: 'old',
      actor: 'user',
      action: 'grant',
      policyVersion: '0.9.0',
      grantedAt: 'old-time'
    }),
    false
  );
});

test('ClickwrapConsent: createProtectedCameraStream should throw BIPA error if consent is missing', async () => {
  const store = new MemoryConsentStore();
  await assert.rejects(
    async () => {
      await createProtectedCameraStream(store);
    },
    /BIPA Consent Violation: Camera access legally prohibited/
  );
});

test('ClickwrapConsent: createProtectedCameraStream should succeed when affirmative consent is stored', async () => {
  const store = new MemoryConsentStore();
  await grantClickwrapConsent(store, 'authorized-user');

  let getUserMediaCalled = false;
  const mockMediaDevices = {
    async getUserMedia(constraints) {
      getUserMediaCalled = true;
      return {
        id: 'mock-stream',
        getTracks: () => []
      };
    }
  };

  const stream = await createProtectedCameraStream(store, {
    mediaDevices: mockMediaDevices
  });

  assert.strictEqual(getUserMediaCalled, true);
  assert.strictEqual(stream.id, 'mock-stream');
});

test('ClickwrapConsent: revokeClickwrapConsent should clear store and stop all tracks', async () => {
  const store = new MemoryConsentStore();
  await grantClickwrapConsent(store, 'user-to-revoke');

  let trackStopped = false;
  const mockStream = {
    getTracks: () => [
      {
        stop: () => {
          trackStopped = true;
        }
      }
    ]
  };

  await revokeClickwrapConsent(store, [mockStream]);
  assert.strictEqual(await store.get(), null);
  assert.strictEqual(trackStopped, true);
});

test('MemorySanitizer: sanitizeFrame should overwrite raw frame and landmark buffers with zeroes', () => {
  const data = new Uint8ClampedArray([255, 128, 64, 32]);
  const landmarks = [new Float32Array([0.1, 0.2, 0.3]), new Float32Array([0.4, 0.5, 0.6])];
  const frame = {
    source: 'camera',
    data,
    landmarks
  };

  assert.strictEqual(isBufferZeroed(data), false);
  sanitizeFrame(frame);

  assert.strictEqual(isBufferZeroed(data), true);
  assert.strictEqual(isFrameSanitized(frame), true);
  assert.strictEqual(frame.landmarks.length, 0);
});

test('MemorySanitizer: createEphemeralFrameLoop should guarantee sanitization even on unhandled error', () => {
  const data = new Uint8ClampedArray([1, 2, 3, 4]);
  const frame = { source: 'camera', data };

  const unsafeProcessor = createEphemeralFrameLoop(() => {
    throw new Error('Pipeline explosion');
  });

  assert.throws(() => unsafeProcessor(frame), /Pipeline explosion/);
  assert.strictEqual(isBufferZeroed(data), true);
});

test('MemorySanitizer: EphemeralScratchPool should acquire and sanitize pool memory', () => {
  const pool = new EphemeralScratchPool(16, 2, 3);
  const frame = pool.acquireFrame();

  frame.data[0] = 99;
  frame.landmarks[0][0] = 1.23;

  assert.strictEqual(isBufferZeroed(frame.data), false);
  pool.releaseAndSanitize(frame);

  assert.strictEqual(isBufferZeroed(pool.getRawBuffer()), true);
});
