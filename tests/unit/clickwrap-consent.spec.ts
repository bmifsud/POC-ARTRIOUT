import { test, expect } from '@playwright/test';
import { grantClickwrapConsent, revokeClickwrapConsent, ConsentStore, ConsentRecord } from '../../packages/compliance/src/ClickwrapConsent';

class MemoryConsentStore implements ConsentStore {
  private record: ConsentRecord | null = null;
  async get(): Promise<ConsentRecord | null> {
    return this.record;
  }
  async save(record: ConsentRecord): Promise<void> {
    this.record = record;
  }
}

test.describe('ClickwrapConsent Security Unit Tests', () => {
  test('should generate cryptographically secure unique UUID v4 format for consent record IDs', async () => {
    const store = new MemoryConsentStore();
    const grantedRecord = await grantClickwrapConsent(store, 'test-actor');
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    expect(grantedRecord.id).toMatch(uuidRegex);

    const revokedRecord = await revokeClickwrapConsent(store, 'test-actor');
    expect(revokedRecord.id).toMatch(uuidRegex);
    expect(revokedRecord.id).not.toEqual(grantedRecord.id);
  });

  test('should generate unique UUID v4 IDs across multiple consecutive calls', async () => {
    const ids = new Set<string>();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    for (let i = 0; i < 50; i++) {
      const store = new MemoryConsentStore();
      const record = await revokeClickwrapConsent(store, `actor-${i}`);
      expect(record.id).toMatch(uuidRegex);
      expect(ids.has(record.id)).toBe(false);
      ids.add(record.id);
    }
  });
});
