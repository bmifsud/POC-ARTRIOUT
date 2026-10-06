import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bootstrapApp } from '../../apps/web-app/src/index.ts';

test('bootstrapApp renders error banner when WebGPU is unavailable', async () => {
  const appended = [];
  const mockContainer = {
    replaceChildren: () => { appended.length = 0; },
    appendChild: (child) => { appended.push(child); }
  };

  globalThis.document = {
    createElement: (tag) => ({
      tag,
      className: '',
      textContent: ''
    })
  };

  try {
    await bootstrapApp(mockContainer as any);
    assert.strictEqual(appended.length, 1);
    assert.strictEqual(appended[0].className, 'error-banner');
  } finally {
    delete (globalThis as any).document;
  }
});
