import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateSalonRecipeMarkdown, generateStyleDefinitionJson } from '../../apps/storefront-widget/src/utils/recipeGenerator';
import { extractPaletteFromImage } from '../../apps/storefront-widget/src/utils/paletteExtractor';

describe('Storefront Widget Recipe Generator Unit Tests', () => {
  const sampleConfig = {
    designName: 'Velvet Crimson Chrome',
    shape: 'Stiletto' as const,
    materialPreset: 'highGlossCrimson',
    palette: ['#C8102E', '#1A1A1A', '#E5C158'],
    artistHandle: 'ElenaNails',
    notes: 'Custom BIPA compliant WebGPU AR try-on set.'
  };

  it('should generate valid Markdown salon recipe card with all specifications', () => {
    const md = generateSalonRecipeMarkdown(sampleConfig);

    assert.ok(md.includes('# Salon Recipe Card - Velvet Crimson Chrome'));
    assert.ok(md.includes('**Artist / Co-Designer:** @ElenaNails'));
    assert.ok(md.includes('**Nail Shape Specification:** Stiletto'));
    assert.ok(md.includes('**WebGPU Material Preset:** highGlossCrimson'));
    assert.ok(md.includes('#C8102E'));
    assert.ok(md.includes('#1A1A1A'));
    assert.ok(md.includes('#E5C158'));
    assert.ok(md.includes('Custom BIPA compliant WebGPU AR try-on set.'));
  });

  it('should generate valid JSON style definition matching schema version 1.0.0', () => {
    const jsonString = generateStyleDefinitionJson(sampleConfig);
    const parsed = JSON.parse(jsonString);

    assert.strictEqual(parsed.schemaVersion, '1.0.0');
    assert.strictEqual(parsed.designName, 'Velvet Crimson Chrome');
    assert.strictEqual(parsed.shape, 'Stiletto');
    assert.strictEqual(parsed.materialPreset, 'highGlossCrimson');
    assert.deepStrictEqual(parsed.palette, ['#C8102E', '#1A1A1A', '#E5C158']);
    assert.strictEqual(parsed.artistHandle, 'ElenaNails');
    assert.ok(parsed.exportedAt);
  });

  it('should handle missing artist handle gracefully in recipe markdown and JSON', () => {
    const configNoHandle = {
      ...sampleConfig,
      artistHandle: undefined
    };

    const md = generateSalonRecipeMarkdown(configNoHandle);
    assert.ok(md.includes('**Artist / Co-Designer:** @NailLabArtist'));

    const json = JSON.parse(generateStyleDefinitionJson(configNoHandle));
    assert.strictEqual(json.artistHandle, 'NailLabArtist');
  });
});

describe('Storefront Widget Palette Extractor Unit Tests', () => {
  it('should reject mood board files exceeding max permitted size (40 MB)', async () => {
    const oversizeFile = new File(['a'.repeat(1024 * 1024)], 'giant-moodboard.png', { type: 'image/png' });
    Object.defineProperty(oversizeFile, 'size', { value: 45 * 1024 * 1024 });

    await assert.rejects(
      async () => {
        await extractPaletteFromImage(oversizeFile, 40);
      },
      {
        message: 'File size exceeds maximum permitted limit of 40 MB'
      }
    );
  });
});
