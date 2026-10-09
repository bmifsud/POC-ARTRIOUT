export class NetworkEgressGuard {
    static active = false;
    static violations = [];
    static activate() {
        this.active = true;
        this.violations = [];
    }
    static recordViolation(url, method = "GET") {
        if (!this.active)
            return;
        this.violations.push({
            url,
            method,
            timestamp: new Date().toISOString()
        });
    }
    static enforceZeroEgress(targetUrl, method = "POST") {
        if (this.active) {
            this.recordViolation(targetUrl, method);
            throw new Error(`Zero-Egress Security Violation: Outbound network request to "${targetUrl}" is strictly prohibited during edge perception execution.`);
        }
    }
    static getReport() {
        return {
            violationCount: this.violations.length,
            violations: [...this.violations]
        };
    }
    static reset() {
        this.active = false;
        this.violations = [];
    }
}
