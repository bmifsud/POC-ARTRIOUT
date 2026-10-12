import { test, expect } from '@playwright/test';
import { validateData } from '../../src/matrix';

test.describe('Matrix Transformations and Data Validation', () => {
  test('should validate valid biometric payload mock data', () => {
    const validData = { id: '123', frames: [], type: 'biometric' };
    expect(validateData(validData)).toBe(true);
  });

  test('should reject invalid data', () => {
    const invalidData = { id: '123' }; // missing required fields
    expect(validateData(invalidData)).toBe(false);
  });
});
