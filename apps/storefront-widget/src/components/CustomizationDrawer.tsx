import React, { useState } from 'react';

export type NailShape = 'Almond' | 'Coffin' | 'Oval' | 'Square' | 'Stiletto';

export interface CustomizationDrawerProps {
  selectedShape: NailShape;
  onSelectShape: (shape: NailShape) => void;
  selectedMaterialKey: string;
  onSelectMaterialKey: (key: string) => void;
  fps?: number;
}

export const CustomizationDrawer: React.FC<CustomizationDrawerProps> = ({
  selectedShape,
  onSelectShape,
  selectedMaterialKey,
  onSelectMaterialKey,
  fps = 60
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const shapes: NailShape[] = ['Almond', 'Coffin', 'Oval', 'Square', 'Stiletto'];

  const materials = [
    { key: 'highGlossCrimson', name: 'High-Gloss Crimson', color: '#c8102e', preview: 'linear-gradient(135deg, #c8102e, #990000)' },
    { key: 'matteBlack', name: 'Matte Onyx Black', color: '#1a1a1a', preview: 'linear-gradient(135deg, #2a2a2a, #0d0d0d)' },
    { key: 'roseGoldChrome', name: 'Rose Gold Chrome', color: '#b76e79', preview: 'linear-gradient(135deg, #f7d6c8, #b76e79)' },
    { key: 'pearlGlitter', name: 'Pearl Glitter Shimmer', color: '#f0f4f8', preview: 'linear-gradient(135deg, #ffffff, #dbeafe)' }
  ];

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #1f2937',
        color: '#f9fafb'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.25rem' }}>✨</span>
          <span style={{ fontWeight: 'bold', fontSize: '1rem', letterSpacing: '0.025em' }}>Lacquer Customizer</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#374151', color: '#9ca3af' }}>
            {fps} FPS
          </span>
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              padding: '6px 12px',
              fontSize: '0.875rem',
              fontWeight: 500,
              borderRadius: '6px',
              backgroundColor: '#374151',
              color: '#f3f4f6',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {isOpen ? 'Collapse Swatches ▼' : 'Expand Swatches ▲'}
          </button>
        </div>
      </div>

      {isOpen && (
        <div style={{
          backgroundColor: '#111827',
          padding: '16px',
          borderTop: '1px solid #1f2937',
          color: '#f9fafb',
          borderBottomLeftRadius: '12px',
          borderBottomRightRadius: '12px'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Geometry / Nail Shape
            </label>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {shapes.map((s) => (
                <button
                  key={s}
                  onClick={() => onSelectShape(s)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    border: selectedShape === s ? '2px solid #ec4899' : '1px solid #374151',
                    backgroundColor: selectedShape === s ? 'rgba(236, 72, 153, 0.15)' : '#1f2937',
                    color: selectedShape === s ? '#f472b6' : '#d1d5db',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              WebGPU PBR Material Presets
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
              {materials.map((m) => {
                const isSelected = selectedMaterialKey === m.key;
                return (
                  <button
                    key={m.key}
                    onClick={() => onSelectMaterialKey(m.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #ec4899' : '1px solid #374151',
                      backgroundColor: isSelected ? 'rgba(236, 72, 153, 0.15)' : '#1f2937',
                      color: isSelected ? '#ffffff' : '#9ca3af',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s'
                    }}
                  >
                    <span style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: m.preview,
                      display: 'inline-block',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                      flexShrink: 0
                    }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
