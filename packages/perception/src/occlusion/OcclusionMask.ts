import { Point3D, NailTransform } from '../mediapipe/NailExtractor';

export interface OcclusionConfig {
  curlDistanceThreshold?: number;
  zDepthTolerance?: number;
}

export class OcclusionMask {
  private curlThreshold: number;
  private zTolerance: number;

  constructor(config: OcclusionConfig = {}) {
    this.curlThreshold = config.curlDistanceThreshold ?? 0.85;
    this.zTolerance = config.zDepthTolerance ?? 0.05;
  }

  public evaluateOcclusion(
    landmarks: Point3D[],
    nails: NailTransform[]
  ): Map<string, boolean> {
    const occlusionResults = new Map<string, boolean>();

    if (!landmarks || landmarks.length < 21) {
      for (const nail of nails) {
        occlusionResults.set(nail.finger, true);
      }
      return occlusionResults;
    }

    const wrist = landmarks[0];
    const middleMCP = landmarks[9];

    for (const nail of nails) {
      const tip = landmarks[nail.tipIndex];
      const dip = landmarks[nail.dipIndex];

      const tipToWrist = this.distance3D(tip, wrist);
      const dipToWrist = this.distance3D(dip, wrist);

      const isCurled = tipToWrist < dipToWrist * this.curlThreshold;
      const isBehindPalm = (tip.z - middleMCP.z) > this.zTolerance;

      const isOccluded = isCurled || isBehindPalm;
      occlusionResults.set(nail.finger, isOccluded);
    }

    return occlusionResults;
  }

  private distance3D(p1: Point3D, p2: Point3D): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dz = p1.z - p2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}
