import type {
  ConsentRecord,
  ConsentStore
} from "./ClickwrapConsent.ts";
import {
  POLICY_VERSION,
  grantClickwrapConsent,
  revokeClickwrapConsent
} from "./ClickwrapConsent.ts";

export interface ClickwrapModalOptions {
  store: ConsentStore;
  actor?: string;
  onConsentGranted?: (record: ConsentRecord) => void;
  onConsentDeclined?: () => void;
  onConsentRevoked?: () => void;
}

export class ClickwrapConsentModal {
  private options: ClickwrapModalOptions;
  private containerElement: HTMLElement | null = null;

  constructor(options: ClickwrapModalOptions) {
    this.options = options;
  }

  public render(): HTMLElement {
    if (typeof document === "undefined") {
      throw new Error("ClickwrapConsentModal requires a browser DOM environment.");
    }

    const overlay = document.createElement("div");
    overlay.className = "bipa-consent-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "bipa-consent-title");
    overlay.setAttribute("aria-describedby", "bipa-consent-description");

    overlay.innerHTML = `
      <div class="bipa-consent-card" style="background:#121316; color:#f0f2f5; padding:24px; border-radius:12px; max-width:540px; font-family:sans-serif; box-shadow:0 10px 30px rgba(0,0,0,0.5);">
        <h2 id="bipa-consent-title" style="margin-top:0; font-size:1.4rem; color:#fff;">Biometric Information Privacy Act (BIPA) Notice & Consent</h2>
        <div id="bipa-consent-description" style="font-size:0.92rem; line-height:1.5; color:#c4cad4;">
          <p>Before initializing hand-tracking and camera features, please review our biometric privacy disclosure:</p>
          <ul style="padding-left:20px; margin-bottom:16px;">
            <li><strong>Biometric Data:</strong> Hand landmark geometry and palm tracking are processed in real-time.</li>
            <li><strong>Edge-Only Processing:</strong> All inference runs strictly on-device in browser volatile memory (RAM).</li>
            <li><strong>Zero Network Egress:</strong> Biometric data, camera frames, and landmarks are <em>never</em> transmitted to external servers or stored permanently.</li>
            <li><strong>Instant Ephemeral Destruction:</strong> Volatile buffers are zeroed out after every frame cycle.</li>
            <li><strong>BIPA Rights:</strong> You may withdraw your consent at any time, immediately releasing camera hardware.</li>
          </ul>
          <p style="font-size:0.8rem; color:#8c93a0;">Policy Version: ${POLICY_VERSION} | Contact: privacy@ar-trion.internal</p>
        </div>
        <div class="bipa-consent-actions" style="display:flex; justify-content:flex-end; gap:12px; margin-top:20px;">
          <button id="bipa-btn-decline" type="button" style="padding:10px 18px; border:1px solid #4a5160; background:transparent; color:#e0e4eb; border-radius:6px; cursor:pointer; font-weight:600;">
            Do not enable
          </button>
          <button id="bipa-btn-accept" type="button" style="padding:10px 18px; border:none; background:#2563eb; color:#fff; border-radius:6px; cursor:pointer; font-weight:600;">
            Enable camera
          </button>
        </div>
      </div>
    `;

    const acceptBtn = overlay.querySelector("#bipa-btn-accept") as HTMLButtonElement;
    const declineBtn = overlay.querySelector("#bipa-btn-decline") as HTMLButtonElement;

    acceptBtn?.addEventListener("click", async () => {
      try {
        const actor = this.options.actor || "anonymous-browser-user";
        const record = await grantClickwrapConsent(this.options.store, actor);
        overlay.remove();
        this.options.onConsentGranted?.(record);
      } catch (err) {
        // Retain modal and surface disclosure on failure
        const errBanner = document.createElement("div");
        errBanner.style.color = "#ff4444";
        errBanner.style.marginTop = "10px";
        errBanner.style.fontSize = "0.9rem";
        errBanner.innerText = "Error authorizing camera: " + (err instanceof Error ? err.message : String(err));

        const existingBanner = overlay.querySelector(".error-banner");
        if (existingBanner) existingBanner.remove();

        errBanner.className = "error-banner";
        overlay.querySelector(".bipa-consent-card")?.appendChild(errBanner);
      }
    });

    declineBtn?.addEventListener("click", () => {
      overlay.remove();
      this.options.onConsentDeclined?.();
    });

    this.containerElement = overlay;
    return overlay;
  }

  public destroy(): void {
    if (this.containerElement) {
      this.containerElement.remove();
      this.containerElement = null;
    }
  }
}
