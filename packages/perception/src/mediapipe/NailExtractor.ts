export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface NailTransform {
  finger: 'thumb' | 'index' | 'middle' | 'ring' | 'pinky';
  center: Point3D;
  normal: Point3D;
  scale: Point3D;
  dipIndex: number;
  tipIndex: number;
}

export class NailExtractor {
  public static readonly DISTAL_PHALANGES = [
    { finger: 'thumb' as const, dip: 3, tip: 4 },
    { finger: 'index' as const, dip: 7, tip: 8 },
    { finger: 'middle' as const, dip: 11, tip: 12 },
    { finger: 'ring' as const, dip: 15, tip: 16 },
    { finger: 'pinky' as const, dip: 19, tip: 20 }
  ];

  private static readonly REUSABLE_TRANSFORMS: NailTransform[] = NailExtractor.DISTAL_PHALANGES.map(phalanx => ({
    finger: phalanx.finger,
    center: { x: 0, y: 0, z: 0 },
    normal: { x: 0, y: 0, z: 1 },
    scale: { x: 0, y: 0, z: 0 },
    dipIndex: phalanx.dip,
    tipIndex: phalanx.tip
  }));

  private static readonly EMPTY_RESULT: NailTransform[] = [];

  public extractNails(landmarks: Point3D[]): NailTransform[] {
    if (!landmarks || landmarks.length < 21) {
      return NailExtractor.EMPTY_RESULT;
    }

    const wrist = landmarks[0];

    for (let i = 0; i < NailExtractor.DISTAL_PHALANGES.length; i++) {
      const phalanx = NailExtractor.DISTAL_PHALANGES[i];
      const target = NailExtractor.REUSABLE_TRANSFORMS[i];
      const dip = landmarks[phalanx.dip];
      const tip = landmarks[phalanx.tip];

      target.center.x = dip.x * 0.35 + tip.x * 0.65;
      target.center.y = dip.y * 0.35 + tip.y * 0.65;
      target.center.z = dip.z * 0.35 + tip.z * 0.65;

      const dirX = tip.x - dip.x;
      const dirY = tip.y - dip.y;
      const dirZ = tip.z - dip.z;
      const length = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ) || 0.001;

      const wristX = dip.x - wrist.x;
      const wristY = dip.y - wrist.y;
      const wristZ = dip.z - wrist.z;

      const normX = dirY * wristZ - dirZ * wristY;
      const normY = dirZ * wristX - dirX * wristZ;
      const normZ = dirX * wristY - dirY * wristX;
      const normLen = Math.sqrt(normX * normX + normY * normY + normZ * normZ);

      if (normLen > 1e-6) {
        target.normal.x = normX / normLen;
        target.normal.y = normY / normLen;
        target.normal.z = normZ / normLen;
      } else {
        target.normal.x = 0;
        target.normal.y = 0;
        target.normal.z = 1;
      }

      target.scale.x = length * 0.45;
      target.scale.y = length * 0.65;
      target.scale.z = length * 0.2;
    }

    return NailExtractor.REUSABLE_TRANSFORMS;
  }
}
