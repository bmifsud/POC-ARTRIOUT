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

function generateSecureId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return 'consent-' + Date.now().toString(36);
}

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

  public grantConsent(): void {
    this.consentGiven = true;
  }

  public revokeConsent(): void {
    this.consentGiven = false;
  }

  public async syncWithStore(): Promise<boolean> {
    if (!this.store) return this.consentGiven;
    const record = await this.store.get();
    this.consentGiven = record?.action === 'grant' && record.policyVersion === POLICY_VERSION;
    return this.consentGiven;
  }

  public async renderModal(
    container: HTMLElement,
    onConsentGranted: () => void | Promise<void>
  ): Promise<void> {
    this.container = container;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'bipa-consent-modal';
    modalOverlay.className = 'bipa-consent-modal-overlay';
    modalOverlay.style.cssText =
      'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 9999; color: #fff; font-family: sans-serif;';

    const card = document.createElement('div');
    card.style.cssText =
      'background: #1e1e2e; padding: 24px; border-radius: 12px; max-width: 450px; width: 90%; box-shadow: 0 10px 25px rgba(0,0,0,0.5);';

    const h2 = document.createElement('h2');
    h2.style.cssText = 'margin-top: 0; color: #f38ba8;';
    h2.textContent = 'BIPA Biometric Consent Notice';

    const p = document.createElement('p');
    p.style.cssText = 'font-size: 14px; line-height: 1.5; color: #cdd6f4;';
    p.textContent =
      'In accordance with the Illinois Biometric Information Privacy Act (BIPA) and global privacy standards, AR Nail Lab processes hand landmarks exclusively in volatile client-side memory on your local device. No video frames, camera data, or biometric vectors will ever be recorded or transmitted over network sockets or HTTP endpoints.';

    const checkboxWrapper = document.createElement('div');
    checkboxWrapper.style.cssText = 'margin: 20px 0; display: flex; align-items: flex-start; gap: 10px;';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'bipa-consent-checkbox';
    checkbox.style.cssText = 'margin-top: 4px; width: 18px; height: 18px; cursor: pointer;';

    const label = document.createElement('label');
    label.htmlFor = 'bipa-consent-checkbox';
    label.style.cssText = 'font-size: 13px; color: #bac2de; cursor: pointer;';
    label.textContent =
      'I agree to the local processing of hand geometric landmarks for virtual nail try-on.';

    checkboxWrapper.appendChild(checkbox);
    checkboxWrapper.appendChild(label);

    const submitBtn = document.createElement('button');
    submitBtn.id = 'bipa-consent-submit';
    submitBtn.disabled = true;
    submitBtn.style.cssText =
      'width: 100%; padding: 12px; border: none; border-radius: 6px; background: #585b70; color: #a6adc8; font-weight: bold; cursor: not-allowed; transition: all 0.2s;';
    submitBtn.textContent = 'Accept & Start Camera';

    card.appendChild(h2);
    card.appendChild(p);
    card.appendChild(checkboxWrapper);
    card.appendChild(submitBtn);
    modalOverlay.appendChild(card);
    container.appendChild(modalOverlay);

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
        this.grantConsent();

        if (this.store) {
          await grantClickwrapConsent(this.store, 'client-user');
        }

        const modal = container.querySelector('#bipa-consent-modal');
        if (modal) modal.remove();

        await onConsentGranted();
        resolve();
      });
    });
  }

  public async requestCameraStream(): Promise<MediaStream> {
    await this.syncWithStore();
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
    id: generateSecureId(),
    actor,
    action: 'grant',
    policyVersion: POLICY_VERSION,
    grantedAt: now()
  };
  await store.save(record);
  return record;
}

export async function revokeClickwrapConsent(
  store: ConsentStore,
  actor: string,
  now = (): string => new Date().toISOString()
): Promise<ConsentRecord> {
  const record: ConsentRecord = {
    id: generateSecureId(),
    actor,
    action: 'revoke',
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
  if (!consentInstance) {
    throw new Error('BIPA Consent Violation: Camera acquisition blocked. A valid ClickwrapConsent instance must be provided.');
  }
  return consentInstance.requestCameraStream();
}
