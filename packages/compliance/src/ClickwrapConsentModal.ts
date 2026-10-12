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
    overlay.style.position = "absolute";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(9, 9, 11, 0.85)";
    overlay.style.backdropFilter = "blur(8px)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "1000";
    overlay.style.padding = "20px";

    const card = document.createElement("div");
    card.className = "bipa-consent-card";
    card.style.background = "linear-gradient(145deg, #18181b, #09090b)";
    card.style.color = "#f4f4f5";
    card.style.padding = "28px";
    card.style.borderRadius = "16px";
    card.style.maxWidth = "520px";
    card.style.width = "100%";
    card.style.fontFamily = "sans-serif";
    card.style.border = "1px solid rgba(244, 114, 182, 0.3)";
    card.style.boxShadow = "0 20px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(244, 114, 182, 0.15)";

    const title = document.createElement("h2");
    title.id = "bipa-consent-title";
    title.style.marginTop = "0";
    title.style.fontSize = "1.35rem";
    title.style.fontWeight = "700";
    title.style.color = "#f472b6";
    title.style.letterSpacing = "-0.02em";
    title.textContent = "BIPA Biometric Consent Notice";

    const desc = document.createElement("div");
    desc.id = "bipa-consent-description";
    desc.style.fontSize = "0.9rem";
    desc.style.lineHeight = "1.55";
    desc.style.color = "#a1a1aa";
    desc.style.marginTop = "12px";

    const p1 = document.createElement("p");
    p1.textContent = "Before initializing hand tracking for virtual nail try-on, please review our zero-retention biometric policy:";
    desc.appendChild(p1);

    const ul = document.createElement("ul");
    ul.style.paddingLeft = "20px";
    ul.style.marginTop = "10px";
    ul.style.marginBottom = "16px";
    const items = [
      "Biometric Data: Hand landmark geometry is processed strictly in local browser memory.",
      "Zero Egress: Raw frames & landmarks are never transmitted over the network.",
      "Instant Erasure: Buffers are scrubbed immediately after each frame tick.",
      "BIPA Compliance: Consent can be revoked at any time to release camera hardware."
    ];
    for (const item of items) {
      const li = document.createElement("li");
      li.style.marginBottom = "6px";
      li.textContent = item;
      ul.appendChild(li);
    }
    desc.appendChild(ul);

    const checkboxContainer = document.createElement("label");
    checkboxContainer.style.display = "flex";
    checkboxContainer.style.alignItems = "center";
    checkboxContainer.style.gap = "10px";
    checkboxContainer.style.margin = "16px 0";
    checkboxContainer.style.padding = "10px 14px";
    checkboxContainer.style.background = "rgba(255, 255, 255, 0.05)";
    checkboxContainer.style.borderRadius = "8px";
    checkboxContainer.style.cursor = "pointer";
    checkboxContainer.style.fontSize = "0.85rem";
    checkboxContainer.style.color = "#e4e4e7";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = "bipa-consent-checkbox";
    checkbox.style.cursor = "pointer";
    checkbox.style.accentColor = "#ec4899";

    const checkboxLabelText = document.createTextNode(" I confirm & agree to local processing of hand geometric landmarks.");
    checkboxContainer.appendChild(checkbox);
    checkboxContainer.appendChild(checkboxLabelText);

    const p2 = document.createElement("p");
    p2.style.fontSize = "0.78rem";
    p2.style.color = "#71717a";
    p2.style.marginTop = "8px";
    p2.textContent = `Policy Version: ${POLICY_VERSION} | Contact: privacy@ar-trion.internal`;
    desc.appendChild(checkboxContainer);
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
    declineBtn.style.padding = "10px 16px";
    declineBtn.style.border = "1px solid #3f3f46";
    declineBtn.style.background = "transparent";
    declineBtn.style.color = "#a1a1aa";
    declineBtn.style.borderRadius = "8px";
    declineBtn.style.cursor = "pointer";
    declineBtn.style.fontWeight = "600";
    declineBtn.style.fontSize = "0.88rem";
    declineBtn.textContent = "Decline";

    const acceptBtn = document.createElement("button");
    acceptBtn.id = "bipa-consent-submit";
    acceptBtn.type = "button";
    acceptBtn.disabled = true;
    acceptBtn.style.padding = "10px 20px";
    acceptBtn.style.border = "none";
    acceptBtn.style.background = "#ec4899";
    acceptBtn.style.color = "#ffffff";
    acceptBtn.style.borderRadius = "8px";
    acceptBtn.style.cursor = "pointer";
    acceptBtn.style.fontWeight = "600";
    acceptBtn.style.fontSize = "0.88rem";
    acceptBtn.style.opacity = "0.5";
    acceptBtn.style.transition = "all 0.2s ease";
    acceptBtn.textContent = "Enable Camera";

    checkbox.addEventListener("change", () => {
      acceptBtn.disabled = !checkbox.checked;
      acceptBtn.style.opacity = checkbox.checked ? "1" : "0.5";
      acceptBtn.style.cursor = checkbox.checked ? "pointer" : "not-allowed";
    });

    actions.appendChild(declineBtn);
    actions.appendChild(acceptBtn);

    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(actions);
    overlay.appendChild(card);

    acceptBtn.addEventListener("click", async () => {
      if (acceptBtn.disabled) return;
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
