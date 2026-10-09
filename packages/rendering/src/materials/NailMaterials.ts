export interface NailMaterial {
  name: string;
  baseColor: [number, number, number, number];
  roughness: number;
  metallic: number;
  clearcoat: number;
  clearcoatRoughness: number;
}

export const NailMaterialCatalog: Record<string, NailMaterial> = {
  highGlossCrimson: {
    name: 'High Gloss Crimson',
    baseColor: [0.8, 0.05, 0.15, 1.0],
    roughness: 0.1,
    metallic: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  },
  matteBlack: {
    name: 'Matte Black',
    baseColor: [0.08, 0.08, 0.09, 1.0],
    roughness: 0.85,
    metallic: 0.05,
    clearcoat: 0.0,
    clearcoatRoughness: 0.5,
  },
  roseGoldChrome: {
    name: 'Rose Gold Chrome',
    baseColor: [0.95, 0.65, 0.6, 1.0],
    roughness: 0.15,
    metallic: 0.95,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1,
  },
  pearlGlitter: {
    name: 'Pearl Glitter',
    baseColor: [0.92, 0.9, 0.95, 0.95],
    roughness: 0.25,
    metallic: 0.4,
    clearcoat: 0.9,
    clearcoatRoughness: 0.2,
  },
};
