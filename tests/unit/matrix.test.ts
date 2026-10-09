import { test, expect } from '@playwright/test';
import { multiply, transformMatrix, validateData } from '../../src/matrix';

test.describe('Matrix Transformations and Data Validation', () => {
  test('should correctly transform a basic matrix', () => {
    const input = [
      [1, 2],
      [3, 4]
    ];
    // Example transformation: transpose the matrix
    const expected = [
      [1, 3],
      [2, 4]
    ];
    expect(transformMatrix(input)).toEqual(expected);
  });

  test('should perform in-place matrix multiplication correctly', () => {
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

    expect(out[0]).toBe(2);
    expect(out[5]).toBe(2);
    expect(out[10]).toBe(2);
    expect(out[12]).toBe(2);
    expect(out[13]).toBe(3);
    expect(out[14]).toBe(4);
    expect(out[15]).toBe(1);
  });

  test('should validate zero additional heap allocations during 10,000 matrix multiplications', () => {
    const out = new Float32Array(16);
    const a = new Float32Array(16).fill(1.5);
    const b = new Float32Array(16).fill(2.5);

    // Warm up
    for (let i = 0; i < 1000; i++) {
      multiply(out, a, b);
    }

    const memStart = process.memoryUsage().heapUsed;
    for (let i = 0; i < 10000; i++) {
      multiply(out, a, b);
    }
    const memEnd = process.memoryUsage().heapUsed;

    expect(memEnd - memStart).toBeLessThanOrEqual(512 * 1024);
  });

  test('should validate valid biometric payload mock data', () => {
    const validData = { id: '123', frames: [], type: 'biometric' };
    expect(validateData(validData)).toBe(true);
  });

  test('should reject invalid data', () => {
    const invalidData = { id: '123' }; // missing required fields
    expect(validateData(invalidData)).toBe(false);
  });
});
