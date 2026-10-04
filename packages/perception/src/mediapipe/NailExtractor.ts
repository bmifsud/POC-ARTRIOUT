export class NailExtractor {
  extractNails(landmarks: Float32Array[]): { nails: Float32Array[], surfaceNormals: Float32Array[], scale: number } {
    if (landmarks.length < 21) throw new Error("Expected 21 landmarks");
    const indices = [3, 4, 7, 8, 11, 12, 15, 16, 19, 20];
    const nails = indices.map(i => landmarks[i]);
    return {
      nails,
      surfaceNormals: [new Float32Array([0, 0, 1])],
      scale: 1.0
    };
  }
}
