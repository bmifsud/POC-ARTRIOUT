import { test, expect } from '@playwright/test';
import { generateSalonRecipeMarkdown, generateStyleDefinitionJson } from '../../apps/storefront-widget/src/utils/recipeGenerator';

test.describe('Storefront Widget Recipe Generator Tests', () => {
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
});
