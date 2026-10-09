import { test, expect } from '@playwright/test';
import { NailExtractor, Point3D } from '../../packages/perception/src/mediapipe/NailExtractor';
import { OcclusionMask } from '../../packages/perception/src/occlusion/OcclusionMask';

test.describe('NailExtractor Unit Tests', () => {
  // Realistic 21-point 3D hand landmarks mock
  const mockHandLandmarks: Point3D[] = Array.from({ length: 21 }, (_, i) => ({
    x: (i % 5) * 0.1,
    y: Math.floor(i / 5) * 0.15,
    z: (i % 3) * 0.05
  }));

  test('should extract distal phalanx transforms for all 5 nail beds', () => {
    const extractor = new NailExtractor();
    const nailTransforms = extractor.extractNails(mockHandLandmarks);

    expect(nailTransforms).toHaveLength(5);

    const fingers = nailTransforms.map(n => n.finger);
    expect(fingers).toEqual(['thumb', 'index', 'middle', 'ring', 'pinky']);

    for (const transform of nailTransforms) {
      expect(transform.center).toBeDefined();
      expect(transform.normal).toBeDefined();
      expect(transform.scale).toBeDefined();

      // Ensure calculated scales are positive finite numbers
      expect(transform.scale.x).toBeGreaterThan(0);
      expect(transform.scale.y).toBeGreaterThan(0);
      expect(transform.scale.z).toBeGreaterThan(0);

      // Ensure calculated normal is a unit vector
      const normLen = Math.sqrt(
        transform.normal.x ** 2 + transform.normal.y ** 2 + transform.normal.z ** 2
      );
      expect(normLen).toBeCloseTo(1.0, 4);
    }
  });

  test('should handle empty or incomplete landmarks gracefully', () => {
    const extractor = new NailExtractor();
    expect(extractor.extractNails([])).toEqual([]);
    expect(extractor.extractNails(mockHandLandmarks.slice(0, 10))).toEqual([]);
  });
});

test.describe('OcclusionMask Unit Tests', () => {
  test('should accurately flag curled finger nails as occluded', () => {
    const extractor = new NailExtractor();
    const occlusion = new OcclusionMask({ curlDistanceThreshold: 0.85 });

    // Open hand setup
    const openHandLandmarks: Point3D[] = Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }));
    openHandLandmarks[0] = { x: 0.5, y: 0.9, z: 0.0 }; // Wrist
    openHandLandmarks[9] = { x: 0.5, y: 0.5, z: 0.0 }; // Middle MCP

    // DIPs far from wrist
    for (const p of [3, 7, 11, 15, 19]) {
      openHandLandmarks[p] = { x: 0.5, y: 0.3, z: 0.0 };
    }
    // Tips even farther from wrist
    for (const p of [4, 8, 12, 16, 20]) {
      openHandLandmarks[p] = { x: 0.5, y: 0.1, z: 0.0 };
    }

    const openNails = extractor.extractNails(openHandLandmarks);
    const openOcclusion = occlusion.evaluateOcclusion(openHandLandmarks, openNails);

    for (const nail of openNails) {
      expect(openOcclusion.get(nail.finger)).toBe(false);
    }

    // Curled hand setup: tips closer to wrist than DIPs
    const curledHandLandmarks = [...openHandLandmarks];
    for (const p of [4, 8, 12, 16, 20]) {
      curledHandLandmarks[p] = { x: 0.5, y: 0.7, z: 0.0 }; // Tip folded back toward wrist
    }

    const curledNails = extractor.extractNails(curledHandLandmarks);
    const curledOcclusion = occlusion.evaluateOcclusion(curledHandLandmarks, curledNails);

    for (const nail of curledNails) {
      expect(curledOcclusion.get(nail.finger)).toBe(true);
    }
  });
});
