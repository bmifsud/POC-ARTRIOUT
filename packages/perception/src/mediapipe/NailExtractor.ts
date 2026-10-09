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

  public extractNails(landmarks: Point3D[]): NailTransform[] {
    if (!landmarks || landmarks.length < 21) {
      return [];
    }

    const wrist = landmarks[0];
    const transforms: NailTransform[] = [];

    for (const phalanx of NailExtractor.DISTAL_PHALANGES) {
      const dip = landmarks[phalanx.dip];
      const tip = landmarks[phalanx.tip];

      const center: Point3D = {
        x: dip.x * 0.35 + tip.x * 0.65,
        y: dip.y * 0.35 + tip.y * 0.65,
        z: dip.z * 0.35 + tip.z * 0.65
      };

      const dirX = tip.x - dip.x;
      const dirY = tip.y - dip.y;
      const dirZ = tip.z - dip.z;
      const length = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ) || 0.001;

      const wristX = dip.x - wrist.x;
      const wristY = dip.y - wrist.y;
      const wristZ = dip.z - wrist.z;

      let normX = dirY * wristZ - dirZ * wristY;
      let normY = dirZ * wristX - dirX * wristZ;
      let normZ = dirX * wristY - dirY * wristX;
      const normLen = Math.sqrt(normX * normX + normY * normY + normZ * normZ) || 1;

      const normal: Point3D = {
        x: normX / normLen,
        y: normY / normLen,
        z: normZ / normLen
      };

      const scale: Point3D = {
        x: length * 0.45,
        y: length * 0.65,
        z: length * 0.2
      };

      transforms.push({
        finger: phalanx.finger,
        center,
        normal,
        scale,
        dipIndex: phalanx.dip,
        tipIndex: phalanx.tip
      });
    }

    return transforms;
  }
}
