import React, { useState, useRef } from 'react';
import { extractPaletteFromImage, ExtractedPalette } from '../utils/paletteExtractor';

export interface CoDesignerProps {
  onPaletteExtracted?: (palette: ExtractedPalette) => void;
  onSelectPresetRecommendation?: (materialKey: string, shape: any) => void;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  palette?: ExtractedPalette;
}

export const CoDesigner: React.FC<CoDesignerProps> = ({
  onPaletteExtracted,
  onSelectPresetRecommendation
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Hello! I am your AI Nail Co-Designer. Upload a mood board or photo (up to 40 MB) or describe your vision, and I will extract custom color palettes and recommend WebGPU lacquer presets!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    setTimeout(() => {
      let aiText = "That's a gorgeous concept! I recommend our High-Gloss Crimson preset in Stiletto shape for a high-impact dramatic style.";
      let recKey = 'highGlossCrimson';

      if (inputText.toLowerCase().includes('black') || inputText.toLowerCase().includes('dark') || inputText.toLowerCase().includes('goth')) {
        aiText = "Dark elegance! The Matte Onyx Black in Coffin shape provides a velvety high-fashion contrast.";
        recKey = 'matteBlack';
      } else if (inputText.toLowerCase().includes('gold') || inputText.toLowerCase().includes('chrome') || inputText.toLowerCase().includes('luxury')) {
        aiText = "Opulent choices! Rose Gold Chrome in Almond shape provides dynamic metallic reflection under tilt lighting.";
        recKey = 'roseGoldChrome';
      } else if (inputText.toLowerCase().includes('sparkle') || inputText.toLowerCase().includes('pearl') || inputText.toLowerCase().includes('shimmer')) {
        aiText = "Dreamy and luminous! Pearl Glitter Shimmer in Oval shape catches dynamic micro-sparkles under ambient light.";
        recKey = 'pearlGlitter';
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);
      if (onSelectPresetRecommendation) {
        onSelectPresetRecommendation(recKey, 'Almond');
      }
    }, 600);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setIsProcessing(true);

    try {
      if (file.size > 40 * 1024 * 1024) {
        throw new Error('File size exceeds the 40 MB maximum allowed limit.');
      }

      const palette = await extractPaletteFromImage(file, 40);

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        sender: 'user',
        text: `Uploaded mood board image: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `Mood board analyzed! Extracted a 3-color palette: Primary (${palette.primary}), Secondary (${palette.secondary}), Accent (${palette.accent}). Swatches applied to customizer!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        palette
      };

      setMessages((prev) => [...prev, userMsg, aiMsg]);

      if (onPaletteExtracted) {
        onPaletteExtracted(palette);
      }
    } catch (err: any) {
      console.error('Mood board upload processing error:', err);
      setErrorMsg(err?.message || 'Failed to analyze photo upload');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '380px', backgroundColor: '#111827', borderRadius: '12px', border: '1px solid #1f2937', color: '#f9fafb', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #1f2937', backgroundColor: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.25rem' }}>🤖</span>
          <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>AI Studio & Co-Designer</span>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          Max 40 MB Upload
        </span>
      </div>

      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              backgroundColor: m.sender === 'user' ? '#ec4899' : '#1f2937',
              color: '#ffffff',
              borderRadius: '12px',
              padding: '10px 14px',
              fontSize: '0.875rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ fontSize: '0.875rem', lineHeight: '1.4' }}>{m.text}</div>

            {m.palette && (
              <div style={{ marginTop: '8px', display: 'flex', gap: '6px', alignItems: 'center', backgroundColor: '#111827', padding: '6px 10px', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Palette:</span>
                {m.palette.rawHexes.map((hex, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: hex, border: '1px solid #374151' }} />
                    <span style={{ fontSize: '0.7rem', color: '#d1d5db' }}>{hex}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ fontSize: '0.65rem', color: m.sender === 'user' ? '#fbcfe8' : '#6b7280', marginTop: '4px', textAlign: 'right' }}>
              {m.timestamp}
            </div>
          </div>
        ))}
        {isProcessing && (
          <div style={{ alignSelf: 'flex-start', color: '#ec4899', fontSize: '0.875rem', fontStyle: 'italic' }}>
            Extracting color palette from photo upload...
          </div>
        )}
      </div>

      {errorMsg && (
        <div style={{ padding: '8px 12px', backgroundColor: '#ef4444', color: '#fff', fontSize: '0.75rem' }}>
          {errorMsg}
        </div>
      )}

      <div style={{ padding: '12px', borderTop: '1px solid #1f2937', backgroundColor: '#1f2937', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Upload mood board photo (up to 40 MB)"
          style={{
            padding: '8px 12px',
            backgroundColor: '#374151',
            color: '#f3f4f6',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.1rem'
          }}
        >
          📷
        </button>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask AI or describe nail aesthetic..."
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '8px',
            backgroundColor: '#111827',
            border: '1px solid #374151',
            color: '#f9fafb',
            fontSize: '0.875rem',
            outline: 'none'
          }}
        />
        <button
          onClick={handleSendMessage}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ec4899',
            color: '#ffffff',
            fontWeight: 600,
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};
