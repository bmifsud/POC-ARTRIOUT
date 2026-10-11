export interface SalonRecipeConfig {
  designName: string;
  shape: 'Almond' | 'Coffin' | 'Oval' | 'Square' | 'Stiletto';
  materialPreset: string;
  palette: string[];
  artistHandle?: string;
  notes?: string;
}

export function generateSalonRecipeMarkdown(config: SalonRecipeConfig): string {
  const timestamp = new Date().toISOString().split('T')[0];
  const handle = config.artistHandle ? `@${config.artistHandle.replace(/^@/, '')}` : '@NailLabArtist';

  return `# Salon Recipe Card - ${config.designName}
**Generated Date:** ${timestamp}
**Artist / Co-Designer:** ${handle}
**Nail Shape Specification:** ${config.shape}
**WebGPU Material Preset:** ${config.materialPreset}

---

## 🎨 Color Palette & Swatches
- **Primary Base:** \`${config.palette[0] || '#C8102E'}\`
- **Secondary Accent:** \`${config.palette[1] || '#000000'}\`
- **Highlight / Shimmer:** \`${config.palette[2] || '#E5C158'}\`

---

## 💅 Application Instructions & Tech Steps
1. **Preparation:** Dehydrate distal phalanx nail bed and apply acid-free primer.
2. **Base Coat:** Apply 1 coat of flexible rubber base and cure for 60s LED.
3. **Shape Construction:** Sculpt **${config.shape}** tip extension using low-heat builder gel.
4. **Color Execution:**
   - Apply 2 thin layers of primary pigment (\`${config.palette[0] || '#C8102E'}\`).
   - Cure 60s per layer.
5. **Finish:** Apply high-gloss non-wipe PBR topcoat.

---

## 📝 Design Notes
${config.notes || 'Customized via Nail Lab AR Proof of Concept co-designer.'}

*Exported with zero-retention edge privacy compliance by Nail Lab AR.*
`;
}

export function generateStyleDefinitionJson(config: SalonRecipeConfig): string {
  return JSON.stringify({
    schemaVersion: "1.0.0",
    id: `style-${Date.now()}`,
    designName: config.designName,
    shape: config.shape,
    materialPreset: config.materialPreset,
    palette: config.palette,
    artistHandle: config.artistHandle || "NailLabArtist",
    notes: config.notes || "",
    exportedAt: new Date().toISOString()
  }, null, 2);
}
