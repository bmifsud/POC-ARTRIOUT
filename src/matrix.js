export function transformMatrix(matrix) {
    if (matrix.length === 0)
        return [];
    // Transpose matrix
    const rows = matrix.length;
    const cols = matrix[0].length;
    const transposed = [];
    for (let c = 0; c < cols; c++) {
        const newRow = [];
        for (let r = 0; r < rows; r++) {
            newRow.push(matrix[r][c]);
        }
        transposed.push(newRow);
    }
    return transposed;
}
export function validateData(data) {
    if (!data || typeof data !== 'object')
        return false;
    // Check for required fields for our mock biometric data
    if (!data.id || data.type !== 'biometric' || !Array.isArray(data.frames)) {
        return false;
    }
    return true;
}
