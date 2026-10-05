export interface ConsentRecord {
  readonly id: string;
  readonly actor: string;
  readonly action: "grant";
  readonly policyVersion: string;
  readonly grantedAt: string;
}

export interface ConsentStore {
  get(): Promise<ConsentRecord | null>;
  save(record: ConsentRecord): Promise<void>;
}

export const POLICY_VERSION = "1.0.0";

/** Grants consent exactly once for one policy version; callers must await save(). */
export async function grantClickwrapConsent(
  store: ConsentStore,
  actor: string,
  now = (): string => new Date().toISOString()
): Promise<ConsentRecord> {
  const existing = await store.get();
  if (existing?.policyVersion === POLICY_VERSION) return existing;

  const record: ConsentRecord = {
    id: crypto.randomUUID(),
    actor,
    action: "grant",
    policyVersion: POLICY_VERSION,
    grantedAt: now()
  };
  await store.save(record);
  return record;
}

export function cameraConsentActive(record: ConsentRecord | null): boolean {
  return record?.action === "grant" && record.policyVersion === POLICY_VERSION;
}

export async function createProtectedCameraStream(): Promise<MediaStream> {
  // Dummy implementation
  return new MediaStream();
}
