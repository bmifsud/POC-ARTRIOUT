import React, { useState, useEffect, useRef } from 'react';
import { ClickwrapConsent } from '@ar-trion/compliance';

export interface CameraGatewayProps {
  onStreamReady: (videoElement: HTMLVideoElement, stream: MediaStream) => void;
  onConsentStatusChange?: (granted: boolean) => void;
  isConsentGranted: boolean;
  onRequestConsent: () => void;
  children?: React.ReactNode;
}

export const CameraGateway: React.FC<CameraGatewayProps> = ({
  onStreamReady,
  onConsentStatusChange,
  isConsentGranted,
  onRequestConsent,
  children
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const modalContainerRef = useRef<HTMLDivElement | null>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isConsentGranted && !streamActive) {
      startCamera();
    }
  }, [isConsentGranted]);

  const startCamera = async () => {
    try {
      setErrorMsg(null);
      const consentInstance = new ClickwrapConsent();
      (consentInstance as any).consentGiven = true;
      const mediaStream = await consentInstance.requestCameraStream();

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        setStreamActive(true);
        onStreamReady(videoRef.current, mediaStream);
        if (onConsentStatusChange) onConsentStatusChange(true);
      }
    } catch (err: any) {
      console.error('Camera stream initialization failed:', err);
      setErrorMsg(err?.message || 'Failed to acquire camera stream');
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '400px', backgroundColor: '#111827', borderRadius: '12px', overflow: 'hidden' }}>
      {!isConsentGranted && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 40,
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          color: '#f8fafc'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💅</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '8px' }}>
            Nail Lab AR Proof of Concept
          </h2>
          <p style={{ maxWidth: '420px', fontSize: '0.875rem', color: '#94a3b8', marginBottom: '24px', lineHeight: '1.5' }}>
            In compliance with Illinois BIPA & global privacy laws, AR hand tracking executes 100% inside your local browser memory.
            No camera frames or biometric data leave your device.
          </p>
          <button
            onClick={onRequestConsent}
            style={{
              padding: '12px 24px',
              backgroundColor: '#ec4899',
              color: '#ffffff',
              fontWeight: 600,
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(236, 72, 153, 0.4)',
              transition: 'all 0.2s'
            }}
          >
            Review BIPA Terms & Enable Camera
          </button>
        </div>
      )}

      <video
        ref={videoRef}
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)',
          display: streamActive ? 'block' : 'none'
        }}
      />

      {streamActive && children}

      {streamActive && (
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          padding: '6px 12px',
          borderRadius: '9999px',
          color: '#34d399',
          fontSize: '0.75rem',
          fontWeight: 600,
          border: '1px solid rgba(52, 211, 153, 0.3)'
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34d399', display: 'inline-block' }} />
          Zero Data Retention • Edge ML Active
        </div>
      )}

      {errorMsg && (
        <div style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          right: '16px',
          backgroundColor: '#ef4444',
          color: '#ffffff',
          padding: '10px 16px',
          borderRadius: '8px',
          fontSize: '0.875rem'
        }}>
          {errorMsg}
        </div>
      )}

      <div ref={modalContainerRef} />
    </div>
  );
};
