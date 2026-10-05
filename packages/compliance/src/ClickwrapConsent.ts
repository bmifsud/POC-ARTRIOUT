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
  clear?(): Promise<void>;
}

export const POLICY_VERSION = "1.0.0";

export class MemoryConsentStore implements ConsentStore {
  private current: ConsentRecord | null = null;

  async get(): Promise<ConsentRecord | null> {
    return this.current;
  }

  async save(record: ConsentRecord): Promise<void> {
    this.current = record;
  }

  async clear(): Promise<void> {
    this.current = null;
  }
}

export class LocalStorageConsentStore implements ConsentStore {
  private key = "artrion_bipa_consent_record";

  async get(): Promise<ConsentRecord | null> {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(this.key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as ConsentRecord;
    } catch {
      return null;
    }
  }

  async save(record: ConsentRecord): Promise<void> {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(this.key, JSON.stringify(record));
    }
  }

  async clear(): Promise<void> {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(this.key);
    }
  }
}

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

export async function revokeClickwrapConsent(
  store: ConsentStore,
  activeStreams: MediaStream[] = []
): Promise<void> {
  if (store.clear) {
    await store.clear();
  }
  for (const stream of activeStreams) {
    stopMediaStream(stream);
  }
}

export function cameraConsentActive(record: ConsentRecord | null): boolean {
  return record?.action === "grant" && record.policyVersion === POLICY_VERSION;
}

export function stopMediaStream(stream: MediaStream): void {
  if (!stream || !stream.getTracks) return;
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

export async function createProtectedCameraStream(
  store: ConsentStore,
  options?: {
    mediaDevices?: { getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> };
    constraints?: MediaStreamConstraints;
  }
): Promise<MediaStream> {
  const record = await store.get();
  if (!cameraConsentActive(record)) {
    throw new Error(
      `BIPA Consent Violation: Camera access legally prohibited. Affirmative clickwrap consent for policy version ${POLICY_VERSION} has not been granted.`
    );
  }

  const md = options?.mediaDevices || (typeof navigator !== "undefined" ? navigator.mediaDevices : null);
  if (!md) {
    throw new Error("MediaDevices API unavailable in the current runtime environment.");
  }

  const constraints: MediaStreamConstraints = options?.constraints || {
    video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 60 } },
    audio: false
  };

  return await md.getUserMedia(constraints);
}
