import React, { useState } from 'react';
import { extractPaletteFromImage, ExtractedPalette } from '../utils/paletteExtractor';

export interface UserSession {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'client' | 'salon_artist';
    avatarUrl?: string;
  } | null;
  route: '/clients' | '/me' | '/public';
}

export interface ConsultationHubProps {
  onPaletteExtracted?: (palette: ExtractedPalette) => void;
  extractedPalette?: ExtractedPalette | null;
}

export const ConsultationHub: React.FC<ConsultationHubProps> = ({
  onPaletteExtracted,
  extractedPalette
}) => {
  const [session, setSession] = useState<UserSession>({
    user: null,
    route: '/public'
  });

  const [splitPos, setSplitPos] = useState<number>(50);
  const [isUploading, setIsUploading] = useState(false);

  const handleGoogleLogin = (role: 'client' | 'salon_artist') => {
    const mockUser = {
      id: `google-${Date.now()}`,
      name: role === 'salon_artist' ? 'Master Artist Elena' : 'Sophia Laurent',
      email: role === 'salon_artist' ? 'elena@naillab.com' : 'sophia@client.com',
      role,
      avatarUrl: role === 'salon_artist' ? '🎨' : '💅'
    };

    setSession({
      user: mockUser,
      route: role === 'salon_artist' ? '/clients' : '/me'
    });
  };

  const handleLogout = () => {
    setSession({
      user: null,
      route: '/public'
    });
  };

  const handleMoodBoardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const palette = await extractPaletteFromImage(file, 40);
      if (onPaletteExtracted) {
        onPaletteExtracted(palette);
      }
    } catch (err) {
      console.error('Mood board extraction error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#111827', borderRadius: '12px', border: '1px solid #1f2937', padding: '20px', color: '#f9fafb' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1f2937', paddingBottom: '16px', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🏢</span> Client Portal & Consultation Hub
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginTop: '2px' }}>
            Secure private routing to Salon CRM (/clients) and Client My Sets (/me)
          </p>
        </div>

        {session.user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{session.user.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#ec4899' }}>Route: {session.route}</div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: '#374151',
                color: '#fff',
                fontSize: '0.75rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleGoogleLogin('client')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: '#ec4899',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.875rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Google Auth (/me)
            </button>
            <button
              onClick={() => handleGoogleLogin('salon_artist')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: '#6366f1',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.875rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Salon CRM (/clients)
            </button>
          </div>
        )}
      </div>

      {session.route === '/clients' && (
        <div style={{ backgroundColor: '#1f2937', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#818cf8', marginBottom: '8px' }}>
            💈 Private Salon CRM Dashboard (/clients)
          </h4>
          <p style={{ fontSize: '0.875rem', color: '#d1d5db' }}>
            Viewing active client appointments, saved AR geometry measurements, and custom PBR recipe card histories for Salon Master Elena.
          </p>
        </div>
      )}

      {session.route === '/me' && (
        <div style={{ backgroundColor: '#1f2937', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#f472b6', marginBottom: '8px' }}>
            💅 Client My Sets Dashboard (/me)
          </h4>
          <p style={{ fontSize: '0.875rem', color: '#d1d5db' }}>
            Your saved virtual nail collections, custom 3-color mood board palettes, and re-order history.
          </p>
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '8px' }}>
          Before & After Interactive Split Comparison
        </h4>
        <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '12px' }}>
          Drag the slider to compare natural bare nails (Before) vs. AR virtual lacquer application (After).
        </p>

        <div style={{ position: 'relative', width: '100%', height: '240px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #374151' }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            color: '#94a3b8'
          }}>
            ✋ Natural Bare Nails (Before)
          </div>

          <div style={{
            position: 'absolute',
            inset: 0,
            width: `${splitPos}%`,
            backgroundColor: '#831843',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            color: '#fbcfe8',
            overflow: 'hidden',
            borderRight: '3px solid #ec4899',
            boxShadow: '0 0 12px rgba(236, 72, 153, 0.8)'
          }}>
            <div style={{ width: '100%', textAlign: 'center', whiteSpace: 'nowrap' }}>
              ✨ High-Gloss Virtual Lacquer (After)
            </div>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            value={splitPos}
            onChange={(e) => setSplitPos(Number(e.target.value))}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'ew-resize',
              margin: 0
            }}
          />
        </div>
      </div>

      <div style={{ backgroundColor: '#1f2937', padding: '16px', borderRadius: '8px' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '8px' }}>
          🎨 Mood Board 3-Color Palette Extraction
        </h4>
        <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '12px' }}>
          Upload inspiration photos to extract primary, secondary, and accent color swatches locally in memory.
        </p>

        <input
          type="file"
          accept="image/*"
          onChange={handleMoodBoardUpload}
          style={{ fontSize: '0.875rem', color: '#d1d5db' }}
        />

        {isUploading && (
          <div style={{ marginTop: '8px', color: '#ec4899', fontSize: '0.85rem' }}>
            Analyzing mood board image...
          </div>
        )}

        {extractedPalette && (
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: '#d1d5db', fontWeight: 600 }}>Active Palette:</span>
            {extractedPalette.rawHexes.map((hex, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: hex, border: '1px solid #ffffff' }} />
                <span style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{hex}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
