export interface NetworkAuditReport {
  readonly violationCount: number;
  readonly violations: Array<{ url: string; method: string; timestamp: string }>;
}

export class NetworkEgressGuard {
  private static active = false;
  private static violations: Array<{ url: string; method: string; timestamp: string }> = [];

  private static originalFetch: typeof window.fetch | null = null;
  private static originalXHR: typeof window.XMLHttpRequest | null = null;
  private static originalSendBeacon: typeof navigator.sendBeacon | null = null;
  private static originalWebSocket: typeof window.WebSocket | null = null;
  private static originalWorker: typeof window.Worker | null = null;

  public static activate(): void {
    this.active = true;
    this.violations = [];
    this.installGlobalPatches();
  }

  public static recordViolation(url: string, method = "GET"): void {
    if (!this.active) return;
    this.violations.push({
      url,
      method,
      timestamp: new Date().toISOString()
    });
  }

  public static enforceZeroEgress(targetUrl: string, method = "POST"): void {
    if (this.active) {
      this.recordViolation(targetUrl, method);
      throw new Error(
        `Zero-Egress Security Violation: Outbound network request to "${targetUrl}" is strictly prohibited during edge perception execution.`
      );
    }
  }

  private static installGlobalPatches(): void {
    if (typeof window === 'undefined') return;

    if (window.fetch && !this.originalFetch) {
      this.originalFetch = window.fetch;
      const self = this;
      window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
        const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        const method = init?.method || (typeof input === 'object' && 'method' in input ? (input as any).method : 'GET');
        self.recordViolation(urlStr, method);
        if (self.active) {
          throw new Error(`Zero-Egress Security Violation: fetch to "${urlStr}" blocked.`);
        }
        return self.originalFetch!.call(window, input, init);
      };
    }

    if (window.XMLHttpRequest && !this.originalXHR) {
      this.originalXHR = window.XMLHttpRequest;
      const self = this;
      const OrigXHR = window.XMLHttpRequest;
      // @ts-ignore
      window.XMLHttpRequest = function () {
        const xhr = new OrigXHR();
        const origOpen = xhr.open;
        xhr.open = function (method: string, url: string | URL, ...args: any[]) {
          const urlStr = url.toString();
          self.recordViolation(urlStr, method);
          if (self.active) {
            throw new Error(`Zero-Egress Security Violation: XMLHttpRequest to "${urlStr}" blocked.`);
          }
          return origOpen.apply(xhr, [method, url, ...args] as any);
        };
        return xhr;
      };
    }

    if (typeof navigator !== 'undefined' && navigator.sendBeacon && !this.originalSendBeacon) {
      this.originalSendBeacon = navigator.sendBeacon;
      const self = this;
      navigator.sendBeacon = function (url: string | URL, data?: BodyInit | null): boolean {
        const urlStr = url.toString();
        self.recordViolation(urlStr, 'POST');
        if (self.active) {
          throw new Error(`Zero-Egress Security Violation: sendBeacon to "${urlStr}" blocked.`);
        }
        return self.originalSendBeacon!.call(navigator, url, data);
      };
    }

    if (window.WebSocket && !this.originalWebSocket) {
      this.originalWebSocket = window.WebSocket;
      const self = this;
      // @ts-ignore
      window.WebSocket = function (url: string | URL, protocols?: string | string[]) {
        const urlStr = url.toString();
        self.recordViolation(urlStr, 'WS');
        if (self.active) {
          throw new Error(`Zero-Egress Security Violation: WebSocket to "${urlStr}" blocked.`);
        }
        return new self.originalWebSocket!(url, protocols);
      };
    }

    if (window.Worker && !this.originalWorker) {
      this.originalWorker = window.Worker;
      const self = this;
      // @ts-ignore
      window.Worker = function (scriptURL: string | URL, options?: WorkerOptions) {
        const urlStr = scriptURL.toString();
        self.recordViolation(urlStr, 'WORKER');
        if (self.active) {
          throw new Error(`Zero-Egress Security Violation: Worker instantiation from "${urlStr}" blocked.`);
        }
        return new self.originalWorker!(scriptURL, options);
      };
    }
  }

  public static getReport(): NetworkAuditReport {
    return {
      violationCount: this.violations.length,
      violations: [...this.violations]
    };
  }

  public static reset(): void {
    this.active = false;
    this.violations = [];

    if (typeof window !== 'undefined') {
      if (this.originalFetch) {
        window.fetch = this.originalFetch;
        this.originalFetch = null;
      }
      if (this.originalXHR) {
        window.XMLHttpRequest = this.originalXHR;
        this.originalXHR = null;
      }
      if (this.originalSendBeacon && typeof navigator !== 'undefined') {
        navigator.sendBeacon = this.originalSendBeacon;
        this.originalSendBeacon = null;
      }
      if (this.originalWebSocket) {
        window.WebSocket = this.originalWebSocket;
        this.originalWebSocket = null;
      }
      if (this.originalWorker) {
        window.Worker = this.originalWorker;
        this.originalWorker = null;
      }
    }
  }
}
