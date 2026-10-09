import assert from 'node:assert/strict';
import test from 'node:test';
import { transformMatrix, validateData } from '../../src/matrix';

test('Matrix Transformations and Data Validation', async (suite) => {
  await suite.test('should correctly transform a basic matrix', () => {
    const input = [
      [1, 2],
      [3, 4]
    ];
    // Example transformation: transpose the matrix
    const expected = [
      [1, 3],
      [2, 4]
    ];
    assert.deepEqual(transformMatrix(input), expected);
  });

  await suite.test('should validate valid biometric payload mock data', () => {
    const validData = { id: '123', frames: [], type: 'biometric' };
    assert.equal(validateData(validData), true);
  });

  await suite.test('should reject invalid data', () => {
    const invalidData = { id: '123' }; // missing required fields
    assert.equal(validateData(invalidData), false);
  });
});
