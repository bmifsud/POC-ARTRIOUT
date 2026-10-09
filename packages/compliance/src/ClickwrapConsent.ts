export interface ConsentRecord {
  readonly id: string;
  readonly actor: string;
  readonly action: 'grant' | 'revoke';
  readonly policyVersion: string;
  readonly grantedAt: string;
}

export interface ConsentStore {
  get(): Promise<ConsentRecord | null>;
  save(record: ConsentRecord): Promise<void>;
}

export const POLICY_VERSION = '1.0.0';

export class ClickwrapConsent {
  private store?: ConsentStore;
  private consentGiven: boolean = false;
  private container: HTMLElement | null = null;

  constructor(store?: ConsentStore) {
    this.store = store;
  }

  public isConsentGranted(): boolean {
    return this.consentGiven;
  }

  public async renderModal(
    container: HTMLElement,
    onConsentGranted: () => void | Promise<void>
  ): Promise<void> {
    this.container = container;
    container.innerHTML = `
      <div id="bipa-consent-modal" class="bipa-consent-modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 9999; color: #fff; font-family: sans-serif;">
        <div style="background: #1e1e2e; padding: 24px; border-radius: 12px; max-width: 450px; width: 90%; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          <h2 style="margin-top: 0; color: #f38ba8;">BIPA Biometric Consent Notice</h2>
          <p style="font-size: 14px; line-height: 1.5; color: #cdd6f4;">
            In accordance with the Illinois Biometric Information Privacy Act (BIPA) and global privacy standards, AR Nail Lab processes hand landmarks exclusively in volatile client-side memory on your local device.
            No video frames, camera data, or biometric vectors will ever be recorded or transmitted over network sockets or HTTP endpoints.
          </p>
          <div style="margin: 20px 0; display: flex; align-items: flex-start; gap: 10px;">
            <input type="checkbox" id="bipa-consent-checkbox" style="margin-top: 4px; width: 18px; height: 18px; cursor: pointer;" />
            <label for="bipa-consent-checkbox" style="font-size: 13px; color: #bac2de; cursor: pointer;">
              I agree to the local processing of hand geometric landmarks for virtual nail try-on.
            </label>
          </div>
          <button id="bipa-consent-submit" disabled style="width: 100%; padding: 12px; border: none; border-radius: 6px; background: #585b70; color: #a6adc8; font-weight: bold; cursor: not-allowed; transition: all 0.2s;">
            Accept & Start Camera
          </button>
        </div>
      </div>
    `;

    const checkbox = container.querySelector('#bipa-consent-checkbox') as HTMLInputElement;
    const submitBtn = container.querySelector('#bipa-consent-submit') as HTMLButtonElement;

    if (checkbox && submitBtn) {
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          submitBtn.disabled = false;
          submitBtn.style.background = '#89b4fa';
          submitBtn.style.color = '#11111b';
          submitBtn.style.cursor = 'pointer';
        } else {
          submitBtn.disabled = true;
          submitBtn.style.background = '#585b70';
          submitBtn.style.color = '#a6adc8';
          submitBtn.style.cursor = 'not-allowed';
        }
      });

      return new Promise<void>((resolve) => {
        submitBtn.addEventListener('click', async () => {
          if (!checkbox.checked) return;
          this.consentGiven = true;

          if (this.store) {
            const record: ConsentRecord = {
              id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
              actor: 'client-user',
              action: 'grant',
              policyVersion: POLICY_VERSION,
              grantedAt: new Date().toISOString()
            };
            await this.store.save(record);
          }

          const modal = container.querySelector('#bipa-consent-modal');
          if (modal) modal.remove();

          await onConsentGranted();
          resolve();
        });
      });
    }
  }

  public async requestCameraStream(): Promise<MediaStream> {
    if (!this.consentGiven) {
      throw new Error('BIPA Consent Violation: Camera acquisition blocked prior to explicit user consent.');
    }
    return await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });
  }
}

export async function grantClickwrapConsent(
  store: ConsentStore,
  actor: string,
  now = (): string => new Date().toISOString()
): Promise<ConsentRecord> {
  const existing = await store.get();
  if (existing?.policyVersion === POLICY_VERSION && existing.action === 'grant') return existing;

  const record: ConsentRecord = {
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
    actor,
    action: 'grant',
    policyVersion: POLICY_VERSION,
    grantedAt: now()
  };
  await store.save(record);
  return record;
}

export function cameraConsentActive(record: ConsentRecord | null): boolean {
  return record?.action === 'grant' && record.policyVersion === POLICY_VERSION;
}

export async function createProtectedCameraStream(consentInstance?: ClickwrapConsent): Promise<MediaStream> {
  if (consentInstance) {
    return consentInstance.requestCameraStream();
  }
  return new MediaStream();
}
