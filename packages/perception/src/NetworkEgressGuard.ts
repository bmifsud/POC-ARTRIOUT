export interface NetworkAuditReport {
  readonly violationCount: number;
  readonly violations: Array<{ url: string; method: string; timestamp: string }>;
}

export class NetworkEgressGuard {
  private static active = false;
  private static violations: Array<{ url: string; method: string; timestamp: string }> = [];

  public static activate(): void {
    this.active = true;
    this.violations = [];
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

  public static getReport(): NetworkAuditReport {
    return {
      violationCount: this.violations.length,
      violations: [...this.violations]
    };
  }

  public static reset(): void {
    this.active = false;
    this.violations = [];
  }
}
