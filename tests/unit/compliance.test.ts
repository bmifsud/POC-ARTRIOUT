import { test, expect } from '@playwright/test';
import {
  generateSecureId,
  grantClickwrapConsent,
  revokeClickwrapConsent,
  ConsentStore,
  ConsentRecord,
  POLICY_VERSION
} from '../../packages/compliance/src/ClickwrapConsent';

test.describe('BIPA Compliance Secure ID & Consent Unit Tests', () => {
  test('generateSecureId should generate valid v4 UUID strings using CSPRNG', async () => {
    const id1 = generateSecureId();
    const id2 = generateSecureId();

    expect(id1).not.toEqual(id2);
    // Standard UUID v4 regex format check (8-4-4-4-12 hex chars)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(id1).toMatch(uuidRegex);
    expect(id2).toMatch(uuidRegex);
  });

  test('grantClickwrapConsent and revokeClickwrapConsent generate secure records with valid UUIDs', async () => {
    let savedRecord: ConsentRecord | null = null;
    const mockStore: ConsentStore = {
      get: async () => savedRecord,
      save: async (record: ConsentRecord) => {
        savedRecord = record;
      }
    };

    const grantRecord = await grantClickwrapConsent(mockStore, 'user-123');
    expect(grantRecord.actor).toBe('user-123');
    expect(grantRecord.action).toBe('grant');
    expect(grantRecord.policyVersion).toBe(POLICY_VERSION);
    expect(grantRecord.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    const revokeRecord = await revokeClickwrapConsent(mockStore, 'user-123');
    expect(revokeRecord.actor).toBe('user-123');
    expect(revokeRecord.action).toBe('revoke');
    expect(revokeRecord.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(revokeRecord.id).not.toEqual(grantRecord.id);
  });

  test('generateSecureId throws error when CSPRNG is completely unavailable', async () => {
    const originalCrypto = globalThis.crypto;
    try {
      // Temporarily remove crypto object to test error guard
      Object.defineProperty(globalThis, 'crypto', {
        value: undefined,
        configurable: true,
        writable: true
      });

      expect(() => generateSecureId()).toThrow(
        'Cryptographically secure random number generator is unavailable.'
      );
    } finally {
      Object.defineProperty(globalThis, 'crypto', {
        value: originalCrypto,
        configurable: true,
        writable: true
      });
    }
  });
});
