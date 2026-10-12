export function validateData(data: any): boolean {
    if (!data || typeof data !== 'object') return false;

    if (!data.id || data.type !== 'biometric' || !Array.isArray(data.frames)) {
        return false;
    }

    return true;
}
