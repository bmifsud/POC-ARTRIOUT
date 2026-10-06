import type {
  ConsentRecord,
  ConsentStore
} from "./ClickwrapConsent";
import {
  POLICY_VERSION,
  grantClickwrapConsent
} from "./ClickwrapConsent";

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

    const card = document.createElement("div");
    card.className = "bipa-consent-card";
    card.style.background = "#121316";
    card.style.color = "#f0f2f5";
    card.style.padding = "24px";
    card.style.borderRadius = "12px";
    card.style.maxWidth = "540px";
    card.style.fontFamily = "sans-serif";
    card.style.boxShadow = "0 10px 30px rgba(0,0,0,0.5)";

    const title = document.createElement("h2");
    title.id = "bipa-consent-title";
    title.style.marginTop = "0";
    title.style.fontSize = "1.4rem";
    title.style.color = "#fff";
    title.textContent = "Biometric Information Privacy Act (BIPA) Notice & Consent";

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

    declineBtn.addEventListener("click", () => {
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
