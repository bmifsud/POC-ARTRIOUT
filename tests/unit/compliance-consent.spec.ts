import { test, expect } from '@playwright/test';
import {
  grantClickwrapConsent,
  revokeClickwrapConsent,
  ConsentStore,
  ConsentRecord,
  POLICY_VERSION
} from '../../packages/compliance/src/ClickwrapConsent';

class MockConsentStore implements ConsentStore {
  private record: ConsentRecord | null = null;

  async get(): Promise<ConsentRecord | null> {
    return this.record;
  }

  async save(record: ConsentRecord): Promise<void> {
    this.record = record;
  }
}

test.describe('ClickwrapConsent Security & ID Generation', () => {
  test('should generate valid UUID v4 formatted IDs when granting and revoking consent', async () => {
    const store = new MockConsentStore();
    const actor = 'test-user-123';

    const grantRecord = await grantClickwrapConsent(store, actor);
    expect(grantRecord.actor).toBe(actor);
    expect(grantRecord.action).toBe('grant');
    expect(grantRecord.policyVersion).toBe(POLICY_VERSION);

    // Validate UUID format (e.g. 8-4-4-4-12 hex string)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(grantRecord.id).toMatch(uuidRegex);

    const revokeRecord = await revokeClickwrapConsent(store, actor);
    expect(revokeRecord.actor).toBe(actor);
    expect(revokeRecord.action).toBe('revoke');
    expect(revokeRecord.id).toMatch(uuidRegex);
    expect(revokeRecord.id).not.toBe(grantRecord.id);
  });
});
