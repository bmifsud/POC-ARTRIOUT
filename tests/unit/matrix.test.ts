import { transformMatrix, validateData } from '../../src/matrix';

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
    expect(transformMatrix(input)).toEqual(expected);
  });

  it('should validate valid biometric payload mock data', () => {
    const validData = { id: '123', frames: [], type: 'biometric' };
    expect(validateData(validData)).toBe(true);
  });

  it('should reject invalid data', () => {
    const invalidData = { id: '123' }; // missing required fields
    expect(validateData(invalidData)).toBe(false);
  });
});
