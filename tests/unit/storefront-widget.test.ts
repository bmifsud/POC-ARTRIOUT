import { test, expect } from '@playwright/test';
import { generateSalonRecipeMarkdown, generateStyleDefinitionJson } from '../../apps/storefront-widget/src/utils/recipeGenerator';
import { extractPaletteFromImage } from '../../apps/storefront-widget/src/utils/paletteExtractor';
import { StorefrontWidget } from '../../apps/storefront-widget/src/index';

test.describe('Storefront Widget Recipe Generator Unit Tests', () => {
  const sampleConfig = {
    designName: 'Velvet Crimson Chrome',
    shape: 'Stiletto' as const,
    materialPreset: 'highGlossCrimson',
    palette: ['#C8102E', '#1A1A1A', '#E5C158'],
    artistHandle: 'ElenaNails',
    notes: 'Custom BIPA compliant WebGPU AR try-on set.'
  };

  test('should generate valid Markdown salon recipe card with all specifications', () => {
    const md = generateSalonRecipeMarkdown(sampleConfig);

    expect(md).toContain('# Salon Recipe Card - Velvet Crimson Chrome');
    expect(md).toContain('**Artist / Co-Designer:** @ElenaNails');
    expect(md).toContain('**Nail Shape Specification:** Stiletto');
    expect(md).toContain('**WebGPU Material Preset:** highGlossCrimson');
    expect(md).toContain('#C8102E');
    expect(md).toContain('#1A1A1A');
    expect(md).toContain('#E5C158');
    expect(md).toContain('Custom BIPA compliant WebGPU AR try-on set.');
  });

  test('should generate valid JSON style definition matching schema version 1.0.0', () => {
    const jsonString = generateStyleDefinitionJson(sampleConfig);
    const parsed = JSON.parse(jsonString);

    expect(parsed.schemaVersion).toBe('1.0.0');
    expect(parsed.designName).toBe('Velvet Crimson Chrome');
    expect(parsed.shape).toBe('Stiletto');
    expect(parsed.materialPreset).toBe('highGlossCrimson');
    expect(parsed.palette).toEqual(['#C8102E', '#1A1A1A', '#E5C158']);
    expect(parsed.artistHandle).toBe('ElenaNails');
    expect(parsed.exportedAt).toBeDefined();
  });

  test('should handle missing artist handle gracefully in recipe markdown and JSON', () => {
    const configNoHandle = {
      ...sampleConfig,
      artistHandle: undefined
    };

    const md = generateSalonRecipeMarkdown(configNoHandle);
    expect(md).toContain('**Artist / Co-Designer:** @NailLabArtist');

    const json = JSON.parse(generateStyleDefinitionJson(configNoHandle));
    expect(json.artistHandle).toBe('NailLabArtist');
  });
});

test.describe('Storefront Widget Palette Extractor Unit Tests', () => {
  test('should reject mood board files exceeding max permitted size (40 MB)', async () => {
    const oversizeFile = new File(['a'.repeat(1024 * 1024)], 'giant-moodboard.png', { type: 'image/png' });
    Object.defineProperty(oversizeFile, 'size', { value: 45 * 1024 * 1024 });

    await expect(extractPaletteFromImage(oversizeFile, 40)).rejects.toThrow(
      'File size exceeds maximum permitted limit of 40 MB'
    );
  });
});

test.describe('Storefront Widget Lifecycle Unit Tests', () => {
  test('should instantiate StorefrontWidget with default options and list available materials', () => {
    const widget = new StorefrontWidget({ autoStart: false });
    const materials = widget.getAvailableMaterials();

    expect(materials).toContain('highGlossCrimson');
    expect(materials).toContain('matteBlack');
    expect(materials).toContain('roseGoldChrome');
    expect(materials).toContain('pearlGlitter');
  });

  test('should set active material when valid key provided', () => {
    const widget = new StorefrontWidget({ autoStart: false });
    widget.setMaterial('roseGoldChrome');
    expect(widget.getAvailableMaterials()).toContain('roseGoldChrome');
  });

  test('should stop session cleanly without throwing', () => {
    const widget = new StorefrontWidget({ autoStart: false });
    expect(() => widget.stop()).not.toThrow();
  });
});
