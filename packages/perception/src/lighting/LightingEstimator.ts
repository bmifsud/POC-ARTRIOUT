export class LightingEstimator {
  async estimateLighting(frame: Uint8ClampedArray): Promise<{ vector: number[], envMap: Float32Array }> {
    return {
      vector: [0.5, 0.5, 0.5],
      envMap: new Float32Array(6 * 64 * 64 * 4).fill(1.0)
    };
  }
}
