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

    const card = document.createElement("div");
    card.className = "bipa-consent-card";
    card.style.cssText = "background:#121316; color:#f0f2f5; padding:24px; border-radius:12px; max-width:540px; font-family:sans-serif; box-shadow:0 10px 30px rgba(0,0,0,0.5);";

    const title = document.createElement("h2");
    title.id = "bipa-consent-title";
    title.style.cssText = "margin-top:0; font-size:1.4rem; color:#fff;";
    title.textContent = "Biometric Information Privacy Act (BIPA) Notice & Consent";

    const description = document.createElement("div");
    description.id = "bipa-consent-description";
    description.style.cssText = "font-size:0.92rem; line-height:1.5; color:#c4cad4;";

    const pIntro = document.createElement("p");
    pIntro.textContent = "Before initializing hand-tracking and camera features, please review our biometric privacy disclosure:";

    const ul = document.createElement("ul");
    ul.style.cssText = "padding-left:20px; margin-bottom:16px;";

    const bulletItems = [
      { label: "Biometric Data: ", text: "Hand landmark geometry and palm tracking are processed in real-time." },
      { label: "Edge-Only Processing: ", text: "All inference runs strictly on-device in browser volatile memory (RAM)." },
      { label: "Zero Network Egress: ", text: "Biometric data, camera frames, and landmarks are never transmitted to external servers or stored permanently." },
      { label: "Instant Ephemeral Destruction: ", text: "Volatile buffers are zeroed out after every frame cycle." },
      { label: "BIPA Rights: ", text: "You may withdraw your consent at any time, immediately releasing camera hardware." }
    ];

    for (const item of bulletItems) {
      const li = document.createElement("li");
      const strong = document.createElement("strong");
      strong.textContent = item.label;
      li.appendChild(strong);
      li.appendChild(document.createTextNode(item.text));
      ul.appendChild(li);
    }

    const pPolicy = document.createElement("p");
    pPolicy.style.cssText = "font-size:0.8rem; color:#8c93a0;";
    pPolicy.textContent = `Policy Version: ${POLICY_VERSION} | Contact: privacy@ar-trion.internal`;

    description.appendChild(pIntro);
    description.appendChild(ul);
    description.appendChild(pPolicy);

    const errorContainer = document.createElement("div");
    errorContainer.id = "bipa-consent-error";
    errorContainer.style.cssText = "display:none; color:#ef4444; font-size:0.85rem; margin-top:10px; font-weight:600;";

    const actions = document.createElement("div");
    actions.className = "bipa-consent-actions";
    actions.style.cssText = "display:flex; justify-content:flex-end; gap:12px; margin-top:20px;";

    const declineBtn = document.createElement("button");
    declineBtn.id = "bipa-btn-decline";
    declineBtn.type = "button";
    declineBtn.style.cssText = "padding:10px 18px; border:1px solid #4a5160; background:transparent; color:#e0e4eb; border-radius:6px; cursor:pointer; font-weight:600;";
    declineBtn.textContent = "Do not enable";

    const revokeBtn = document.createElement("button");
    revokeBtn.id = "bipa-btn-revoke";
    revokeBtn.type = "button";
    revokeBtn.style.cssText = "padding:10px 18px; border:1px solid #ef4444; background:transparent; color:#ef4444; border-radius:6px; cursor:pointer; font-weight:600;";
    revokeBtn.textContent = "Revoke consent";

    const acceptBtn = document.createElement("button");
    acceptBtn.id = "bipa-btn-accept";
    acceptBtn.type = "button";
    acceptBtn.style.cssText = "padding:10px 18px; border:none; background:#2563eb; color:#fff; border-radius:6px; cursor:pointer; font-weight:600;";
    acceptBtn.textContent = "Enable camera";

    acceptBtn.addEventListener("click", async () => {
      try {
        errorContainer.style.display = "none";
        errorContainer.textContent = "";
        const actor = this.options.actor || "anonymous-browser-user";
        const record = await grantClickwrapConsent(this.options.store, actor);
        overlay.remove();
        this.options.onConsentGranted?.(record);
      } catch (err: any) {
        errorContainer.style.display = "block";
        errorContainer.textContent = `Consent initialization error: ${err?.message || String(err)}`;
      }
    });

    revokeBtn.addEventListener("click", async () => {
      try {
        errorContainer.style.display = "none";
        errorContainer.textContent = "";
        await revokeClickwrapConsent(this.options.store);
        overlay.remove();
        this.options.onConsentRevoked?.();
      } catch (err: any) {
        errorContainer.style.display = "block";
        errorContainer.textContent = `Consent revocation error: ${err?.message || String(err)}`;
      }
    });

    declineBtn.addEventListener("click", () => {
      overlay.remove();
      this.options.onConsentDeclined?.();
    });

    actions.appendChild(declineBtn);
    actions.appendChild(revokeBtn);
    actions.appendChild(acceptBtn);

    card.appendChild(title);
    card.appendChild(description);
    card.appendChild(errorContainer);
    card.appendChild(actions);

    overlay.appendChild(card);

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
