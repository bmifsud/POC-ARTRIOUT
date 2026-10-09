export const POLICY_VERSION = "1.0.0";
/** Grants consent exactly once for one policy version; callers must await save(). */
export async function grantClickwrapConsent(store, actor, now = () => new Date().toISOString()) {
    const existing = await store.get();
    if (existing?.policyVersion === POLICY_VERSION)
        return existing;
    const record = {
        id: crypto.randomUUID(),
        actor,
        action: "grant",
        policyVersion: POLICY_VERSION,
        grantedAt: now()
    };
    await store.save(record);
    return record;
}
export function cameraConsentActive(record) {
    return record?.action === "grant" && record.policyVersion === POLICY_VERSION;
}
export async function createProtectedCameraStream() {
    // Dummy implementation
    return new MediaStream();
}
