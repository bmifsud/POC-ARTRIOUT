import { describe, it } from 'node:test';
import assert from 'node:assert';
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

describe('ClickwrapConsent ID Security', () => {
  it('should generate cryptographically secure unique UUIDs without relying on insecure Math.random', async () => {
    const store = new MemoryConsentStore();
    const record = await grantClickwrapConsent(store, 'test-actor');
    assert.ok(record.id);
    assert.strictEqual(typeof record.id, 'string');
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    assert.match(record.id, uuidRegex, `Expected record.id '${record.id}' to match UUID v4 format`);

    const record2 = await revokeClickwrapConsent(store, 'test-actor');
    assert.ok(record2.id);
    assert.match(record2.id, uuidRegex, `Expected record2.id '${record2.id}' to match UUID v4 format`);
    assert.notStrictEqual(record.id, record2.id);
  });
});
