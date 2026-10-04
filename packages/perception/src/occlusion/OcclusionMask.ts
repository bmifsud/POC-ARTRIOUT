export class OcclusionMask {
  generateMask(depth: number, mcp: Float32Array, wrist: Float32Array): boolean {
    const mcpZ = mcp[2];
    const curlDistance = Math.hypot(mcp[0] - wrist[0], mcp[1] - wrist[1], mcp[2] - wrist[2]);
    return depth > mcpZ || curlDistance < 0.1;
  }
}
