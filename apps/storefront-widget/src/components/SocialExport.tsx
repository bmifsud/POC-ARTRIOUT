import React, { useState, useRef } from 'react';
import { generateSalonRecipeMarkdown, generateStyleDefinitionJson, SalonRecipeConfig } from '../utils/recipeGenerator';

export interface SocialExportProps {
  currentConfig: SalonRecipeConfig;
  arCanvasElement?: HTMLCanvasElement | null;
}

export const SocialExport: React.FC<SocialExportProps> = ({
  currentConfig,
  arCanvasElement
}) => {
  const [artistHandle, setArtistHandle] = useState(currentConfig.artistHandle || 'NailLabArtist');
  const [designName, setDesignName] = useState(currentConfig.designName || 'Velvet Crimson Set');
  const [isExporting, setIsExporting] = useState(false);
  const storyCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeConfig: SalonRecipeConfig = {
    ...currentConfig,
    artistHandle,
    designName
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = () => {
    const md = generateSalonRecipeMarkdown(activeConfig);
    const filename = `${designName.toLowerCase().replace(/\s+/g, '-')}-recipe.md`;
    downloadFile(md, filename, 'text/markdown');
  };

  const handleExportJson = () => {
    const json = generateStyleDefinitionJson(activeConfig);
    const filename = `${designName.toLowerCase().replace(/\s+/g, '-')}-style.json`;
    downloadFile(json, filename, 'application/json');
  };

  const handleGenerateSocialStory = () => {
    setIsExporting(true);

    const canvas = storyCanvasRef.current || document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setIsExporting(false);
      return;
    }

    const bgGradient = ctx.createLinearGradient(0, 0, 1080, 1920);
    bgGradient.addColorStop(0, '#0f172a');
    bgGradient.addColorStop(0.5, '#1e1b4b');
    bgGradient.addColorStop(1, '#020617');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1080, 1920);

    const sweepGradient = ctx.createLinearGradient(0, 0, 1080, 1920);
    sweepGradient.addColorStop(0, 'rgba(236, 72, 153, 0.25)');
    sweepGradient.addColorStop(0.3, 'rgba(236, 72, 153, 0.05)');
    sweepGradient.addColorStop(0.6, 'rgba(168, 85, 247, 0.2)');
    sweepGradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
    ctx.fillStyle = sweepGradient;
    ctx.fillRect(0, 0, 1080, 1920);

    if (arCanvasElement) {
      try {
        ctx.save();
        ctx.translate(540, 800);
        ctx.scale(-1, 1);
        ctx.drawImage(arCanvasElement, -450, -400, 900, 800);
        ctx.restore();
      } catch {
        // Fallback
      }
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.roundRect(140, 400, 800, 800, 32);
      ctx.fill();

      ctx.font = 'bold 48px sans-serif';
      ctx.fillStyle = '#ec4899';
      ctx.textAlign = 'center';
      ctx.fillText('💅 Virtual AR Lacquer Preview', 540, 800);
    }

    ctx.font = '900 64px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(designName.toUpperCase(), 540, 200);

    ctx.font = '600 36px sans-serif';
    ctx.fillStyle = '#f472b6';
    ctx.fillText(`${activeConfig.shape} Shape • ${activeConfig.materialPreset}`, 540, 270);

    const palette = activeConfig.palette;
    const badgeY = 1400;
    const startX = 540 - ((palette.length - 1) * 120) / 2;

    palette.forEach((hex, idx) => {
      const x = startX + idx * 120;
      ctx.beginPath();
      ctx.arc(x, badgeY, 40, 0, Math.PI * 2);
      ctx.fillStyle = hex;
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    });

    ctx.font = 'bold 42px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    const handleTag = artistHandle.startsWith('@') ? artistHandle : `@${artistHandle}`;
    ctx.fillText(`Co-Designed by ${handleTag}`, 540, 1650);

    ctx.font = '500 32px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Nail Lab AR Proof of Concept • BIPA Edge Compliant', 540, 1720);

    setTimeout(() => {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${designName.toLowerCase().replace(/\s+/g, '-')}-story-9x16.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
        setIsExporting(false);
      }, 'image/png');
    }, 100);
  };

  return (
    <div style={{ backgroundColor: '#111827', padding: '20px', borderRadius: '12px', border: '1px solid #1f2937', color: '#f9fafb' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <span style={{ fontSize: '1.25rem' }}>📤</span>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Salon Tech & Social Export Engine</h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px' }}>Design Name</label>
          <input
            type="text"
            value={designName}
            onChange={(e) => setDesignName(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', backgroundColor: '#1f2937', border: '1px solid #374151', color: '#fff', fontSize: '0.875rem' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px' }}>Artist Handle / Watermark</label>
          <input
            type="text"
            value={artistHandle}
            onChange={(e) => setArtistHandle(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', backgroundColor: '#1f2937', border: '1px solid #374151', color: '#fff', fontSize: '0.875rem' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        <button
          onClick={handleExportMarkdown}
          style={{
            flex: 1,
            minWidth: '160px',
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          📄 Export Salon Recipe (.md)
        </button>

        <button
          onClick={handleExportJson}
          style={{
            flex: 1,
            minWidth: '160px',
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: '#8b5cf6',
            color: '#ffffff',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          ⚙️ Export Style JSON
        </button>

        <button
          onClick={handleGenerateSocialStory}
          disabled={isExporting}
          style={{
            flex: 1,
            minWidth: '180px',
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: '#ec4899',
            color: '#ffffff',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          {isExporting ? 'Generating Story...' : '📸 Generate 9:16 Social Story'}
        </button>
      </div>

      <canvas ref={storyCanvasRef} style={{ display: 'none' }} />
    </div>
  );
};
