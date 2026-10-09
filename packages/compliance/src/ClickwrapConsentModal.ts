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

    const desc = document.createElement("div");
    desc.id = "bipa-consent-description";
    desc.style.fontSize = "0.92rem";
    desc.style.lineHeight = "1.5";
    desc.style.color = "#c4cad4";

    const p1 = document.createElement("p");
    p1.textContent = "Before initializing hand-tracking and camera features, please review our biometric privacy disclosure:";
    desc.appendChild(p1);

    const ul = document.createElement("ul");
    ul.style.paddingLeft = "20px";
    ul.style.marginBottom = "16px";
    const items = [
      "Biometric Data: Hand landmark geometry and palm tracking are processed in real-time.",
      "Edge-Only Processing: All inference runs strictly on-device in browser volatile memory (RAM).",
      "Zero Network Egress: Biometric data, camera frames, and landmarks are never transmitted to external servers or stored permanently.",
      "Instant Ephemeral Destruction: Volatile buffers are zeroed out after every frame cycle.",
      "BIPA Rights: You may withdraw your consent at any time, immediately releasing camera hardware."
    ];
    for (const item of items) {
      const li = document.createElement("li");
      li.textContent = item;
      ul.appendChild(li);
    }
    desc.appendChild(ul);

    const p2 = document.createElement("p");
    p2.style.fontSize = "0.8rem";
    p2.style.color = "#8c93a0";
    p2.textContent = `Policy Version: ${POLICY_VERSION} | Contact: privacy@ar-trion.internal`;
    desc.appendChild(p2);

    const actions = document.createElement("div");
    actions.className = "bipa-consent-actions";
    actions.style.display = "flex";
    actions.style.justifyContent = "flex-end";
    actions.style.gap = "12px";
    actions.style.marginTop = "20px";

    const declineBtn = document.createElement("button");
    declineBtn.id = "bipa-btn-decline";
    declineBtn.type = "button";
    declineBtn.style.padding = "10px 18px";
    declineBtn.style.border = "1px solid #4a5160";
    declineBtn.style.background = "transparent";
    declineBtn.style.color = "#e0e4eb";
    declineBtn.style.borderRadius = "6px";
    declineBtn.style.cursor = "pointer";
    declineBtn.style.fontWeight = "600";
    declineBtn.textContent = "Do not enable";

    const acceptBtn = document.createElement("button");
    acceptBtn.id = "bipa-btn-accept";
    acceptBtn.type = "button";
    acceptBtn.style.padding = "10px 18px";
    acceptBtn.style.border = "none";
    acceptBtn.style.background = "#2563eb";
    acceptBtn.style.color = "#fff";
    acceptBtn.style.borderRadius = "6px";
    acceptBtn.style.cursor = "pointer";
    acceptBtn.style.fontWeight = "600";
    acceptBtn.textContent = "Enable camera";

    actions.appendChild(declineBtn);
    actions.appendChild(acceptBtn);

    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(actions);
    overlay.appendChild(card);

    acceptBtn.addEventListener("click", async () => {
      const actor = this.options.actor || "anonymous-browser-user";
      const record = await grantClickwrapConsent(this.options.store, actor);
      overlay.remove();
      this.options.onConsentGranted?.(record);
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
