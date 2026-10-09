import { test, expect } from '@playwright/test';
import { transformMatrix, validateData } from '../../src/matrix';
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
    test('should validate valid biometric payload mock data', () => {
        const validData = { id: '123', frames: [], type: 'biometric' };
        expect(validateData(validData)).toBe(true);
    });
    test('should reject invalid data', () => {
        const invalidData = { id: '123' }; // missing required fields
        expect(validateData(invalidData)).toBe(false);
    });
});
