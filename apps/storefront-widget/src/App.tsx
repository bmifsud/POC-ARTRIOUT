import React, { useState, useRef } from 'react';
import { ClickwrapConsentModal, ConsentStore, ConsentRecord } from '@ar-trion/compliance';
import { CameraGateway } from './components/CameraGateway';
import { CustomizationDrawer, NailShape } from './components/CustomizationDrawer';
import { CoDesigner } from './components/CoDesigner';
import { SocialExport } from './components/SocialExport';
import { ConsultationHub } from './components/ConsultationHub';
import { useARFrameLoop } from './hooks/useARFrameLoop';
import { ExtractedPalette } from './utils/paletteExtractor';

export interface AppProps {
  shopType?: 'custom' | 'shopify' | 'woocommerce';
  primaryColor?: string;
}

export const App: React.FC<AppProps> = ({
  shopType = 'custom',
  primaryColor = '#ec4899'
}) => {
  const [activeTab, setActiveTab] = useState<'tryon' | 'codesigner' | 'consultation' | 'export'>('tryon');
  const [selectedShape, setSelectedShape] = useState<NailShape>('Almond');
  const [selectedMaterialKey, setSelectedMaterialKey] = useState<string>('highGlossCrimson');
  const [isConsentGranted, setIsConsentGranted] = useState(false);
  const [extractedPalette, setExtractedPalette] = useState<ExtractedPalette | null>(null);

  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const modalContainerRef = useRef<HTMLDivElement | null>(null);

  const { fps } = useARFrameLoop({
    videoElement,
    canvasElement: canvasRef.current,
    materialKey: selectedMaterialKey,
    shape: selectedShape,
    isConsentGranted
  });

  const handleRequestConsent = () => {
    const mockStore: ConsentStore = {
      async get() { return null; },
      async save(record: ConsentRecord) { return; }
    };

    const modal = new ClickwrapConsentModal({
      store: mockStore,
      onConsentGranted: () => {
        setIsConsentGranted(true);
      },
      onConsentDeclined: () => {
        setIsConsentGranted(false);
      }
    });

    if (modalContainerRef.current) {
      modalContainerRef.current.innerHTML = '';
      const elem = modal.render();
      modalContainerRef.current.appendChild(elem);
    }
  };

  const handlePaletteExtracted = (palette: ExtractedPalette) => {
    setExtractedPalette(palette);
  };

  const handlePresetRecommendation = (materialKey: string, shape: NailShape) => {
    setSelectedMaterialKey(materialKey);
    if (shape) setSelectedShape(shape);
  };

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '16px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      color: '#f9fafb',
      backgroundColor: '#030712',
      minHeight: '100vh',
      borderRadius: '16px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
    }}>
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '16px',
        borderBottom: '1px solid #1f2937',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: primaryColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            boxShadow: `0 4px 14px ${primaryColor}66`
          }}>
            💅
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Nail Lab AR Proof of Concept</h1>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Embed Target: {shopType.toUpperCase()} Storefront</span>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: '6px', backgroundColor: '#111827', padding: '4px', borderRadius: '10px', border: '1px solid #1f2937' }}>
          {[
            { id: 'tryon', label: '📷 AR Try-On' },
            { id: 'codesigner', label: '🤖 AI Co-Designer' },
            { id: 'consultation', label: '🏢 Consultation Hub' },
            { id: 'export', label: '📤 Export & Recipe' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                border: 'none',
                backgroundColor: activeTab === tab.id ? primaryColor : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : '#9ca3af',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        {activeTab === 'tryon' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ position: 'relative', width: '100%', height: '520px', borderRadius: '12px', overflow: 'hidden' }}>
              <CameraGateway
                isConsentGranted={isConsentGranted}
                onRequestConsent={handleRequestConsent}
                onStreamReady={(video) => setVideoElement(video)}
              >
                <canvas
                  ref={canvasRef}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    transform: 'scaleX(-1)'
                  }}
                />
              </CameraGateway>
            </div>

            <CustomizationDrawer
              selectedShape={selectedShape}
              onSelectShape={(s) => setSelectedShape(s)}
              selectedMaterialKey={selectedMaterialKey}
              onSelectMaterialKey={(k) => setSelectedMaterialKey(k)}
              fps={fps}
            />
          </div>
        )}

        {activeTab === 'codesigner' && (
          <div style={{ height: '600px' }}>
            <CoDesigner
              onPaletteExtracted={handlePaletteExtracted}
              onSelectPresetRecommendation={handlePresetRecommendation}
            />
          </div>
        )}

        {activeTab === 'consultation' && (
          <ConsultationHub
            onPaletteExtracted={handlePaletteExtracted}
            extractedPalette={extractedPalette}
          />
        )}

        {activeTab === 'export' && (
          <SocialExport
            currentConfig={{
              designName: 'Lacquer Proof of Concept Custom Set',
              shape: selectedShape,
              materialPreset: selectedMaterialKey,
              palette: extractedPalette ? extractedPalette.rawHexes : ['#c8102e', '#1a1a1a', '#b76e79'],
              artistHandle: 'NailLabArtist'
            }}
            arCanvasElement={canvasRef.current}
          />
        )}
      </main>

      <div ref={modalContainerRef} />
    </div>
  );
};
