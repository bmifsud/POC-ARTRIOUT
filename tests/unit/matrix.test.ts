import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { transformMatrix, validateData } from '../../src/matrix.ts';

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

  it('should validate valid biometric payload mock data', () => {
    const validData = { id: '123', frames: [], type: 'biometric' };
    assert.strictEqual(validateData(validData), true);
  });

  it('should reject invalid data', () => {
    const invalidData = { id: '123' }; // missing required fields
    assert.strictEqual(validateData(invalidData), false);
  });
});
