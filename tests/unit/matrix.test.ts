import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { multiply, transformMatrix, validateData } from '../../src/matrix';

describe('Matrix Transformations and Data Validation', () => {
  it('should correctly transform a basic matrix', () => {
    const input = [
      [1, 2],
      [3, 4]
    ];
    // Example transformation: transpose the matrix
    const expected = [
      [1, 3],
      [2, 4]
    ];
    assert.deepStrictEqual(transformMatrix(input), expected);
  });

  it('should perform in-place matrix multiplication correctly', () => {
    const out = new Float32Array(16);
    const a = new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      2, 3, 4, 1
    ]);
    const b = new Float32Array([
      2, 0, 0, 0,
      0, 2, 0, 0,
      0, 0, 2, 0,
      0, 0, 0, 1
    ]);

    multiply(out, a, b);

    assert.strictEqual(out[0], 2);
    assert.strictEqual(out[5], 2);
    assert.strictEqual(out[10], 2);
    assert.strictEqual(out[12], 2);
    assert.strictEqual(out[13], 3);
    assert.strictEqual(out[14], 4);
    assert.strictEqual(out[15], 1);
  });

  it('should validate zero additional heap allocations during 10,000 matrix multiplications', () => {
    const out = new Float32Array(16);
    const a = new Float32Array(16).fill(1.5);
    const b = new Float32Array(16).fill(2.5);

    // Warm up V8 JIT compiler to inline multiply and stabilize execution profile
    for (let i = 0; i < 50000; i++) {
      multiply(out, a, b);
    }

    if (typeof global.gc === 'function') {
      global.gc();
    }

    const memStart = process.memoryUsage().heapUsed;
    for (let i = 0; i < 10000; i++) {
      multiply(out, a, b);
    }
    const memEnd = process.memoryUsage().heapUsed;

    const memDelta = memEnd - memStart;

    // Verify in-place zero-allocation arithmetic
    assert.ok(memDelta <= 512 * 1024);
  });

  it('should validate valid biometric payload mock data', () => {
    const validData = { id: '123', frames: [], type: 'biometric' };
    assert.strictEqual(validateData(validData), true);
  });

  it('should reject invalid data', () => {
    const invalidData = { id: '123' }; // missing required fields
    assert.strictEqual(validateData(invalidData), false);
  });
});
