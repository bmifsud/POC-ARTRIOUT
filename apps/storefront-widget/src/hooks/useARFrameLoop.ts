import { useEffect, useRef, useState } from 'react';
import { MemorySanitizer, EphemeralFrameData } from '@ar-trion/compliance';
import { HandTracker, NailExtractor, OcclusionMask, LightingEstimator, Point3D } from '@ar-trion/perception';
import { WebGPURenderer, NailMaterialCatalog, RenderTransform } from '@ar-trion/rendering';

export interface UseARFrameLoopOptions {
  videoElement: HTMLVideoElement | null;
  canvasElement: HTMLCanvasElement | null;
  materialKey: string;
  shape: 'Almond' | 'Coffin' | 'Oval' | 'Square' | 'Stiletto';
  isConsentGranted: boolean;
}

export function useARFrameLoop({
  videoElement,
  canvasElement,
  materialKey,
  shape,
  isConsentGranted
}: UseARFrameLoopOptions) {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [fps, setFps] = useState(0);
  const [gyroTilt, setGyroTilt] = useState<{ alpha: number; beta: number; gamma: number }>({
    alpha: 0,
    beta: 0,
    gamma: 0
  });

  const handTrackerRef = useRef<HandTracker | null>(null);
  const nailExtractorRef = useRef<NailExtractor | null>(null);
  const occlusionMaskRef = useRef<OcclusionMask | null>(null);
  const lightingEstimatorRef = useRef<LightingEstimator | null>(null);
  const rendererRef = useRef<WebGPURenderer | null>(null);

  const animationFrameRef = useRef<number | null>(null);
  const isRunningRef = useRef<boolean>(false);

  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      const alpha = event.alpha || 0;
      const beta = event.beta || 0;
      const gamma = event.gamma || 0;
      setGyroTilt({ alpha, beta, gamma });
    };

    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
        window.removeEventListener('deviceorientation', handleOrientation);
      }
    };
  }, []);

  useEffect(() => {
    if (!isConsentGranted || !videoElement || !canvasElement) return;

    let isSubscribed = true;

    async function initPipeline() {
      setIsInitializing(true);
      try {
        const tracker = new HandTracker();
        const extractor = new NailExtractor();
        const mask = new OcclusionMask();
        const lighting = new LightingEstimator();
        const renderer = new WebGPURenderer(canvasElement!);

        await tracker.initialize();
        await lighting.initialize();
        await renderer.initialize();

        if (!isSubscribed) {
          tracker.close();
          lighting.close();
          return;
        }

        handTrackerRef.current = tracker;
        nailExtractorRef.current = extractor;
        occlusionMaskRef.current = mask;
        lightingEstimatorRef.current = lighting;
        rendererRef.current = renderer;

        setIsReady(true);
        isRunningRef.current = true;
      } catch (err) {
        console.error('Failed to initialize AR Frame Loop pipeline:', err);
      } finally {
        if (isSubscribed) {
          setIsInitializing(false);
        }
      }
    }

    initPipeline();

    return () => {
      isSubscribed = false;
      isRunningRef.current = false;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      handTrackerRef.current?.close();
      lightingEstimatorRef.current?.close();
      handTrackerRef.current = null;
      nailExtractorRef.current = null;
      occlusionMaskRef.current = null;
      lightingEstimatorRef.current = null;
      rendererRef.current = null;
      setIsReady(false);
    };
  }, [isConsentGranted, videoElement, canvasElement]);

  useEffect(() => {
    if (!isReady || !videoElement || !canvasElement) return;

    let frameCount = 0;
    let lastFpsCheck = performance.now();

    const loop = async () => {
      if (!isRunningRef.current || !videoElement || !canvasElement) return;

      const frameTimestamp = performance.now();
      let currentFrameData: EphemeralFrameData | null = null;

      try {
        const tracker = handTrackerRef.current;
        const extractor = nailExtractorRef.current;
        const mask = occlusionMaskRef.current;
        const lightingEstimator = lightingEstimatorRef.current;
        const renderer = rendererRef.current;

        if (tracker && extractor && mask && lightingEstimator && renderer) {
          const result = tracker.detectForVideo(videoElement, frameTimestamp);

          if (result && result.landmarks && result.landmarks.length > 0) {
            const rawLandmarks = result.landmarks[0] as Point3D[];
            const nailTransforms = extractor.extractNails(rawLandmarks);
            const occlusionMap = mask.evaluateOcclusion(rawLandmarks, nailTransforms);
            const lighting = await lightingEstimator.estimateLighting(videoElement);

            const radGamma = (gyroTilt.gamma * Math.PI) / 180;
            const radBeta = (gyroTilt.beta * Math.PI) / 180;

            const tiltLightVector: [number, number, number] = [
              lighting.directionalLightVector[0] + Math.sin(radGamma) * 0.5,
              lighting.directionalLightVector[1] + Math.sin(radBeta) * 0.5,
              lighting.directionalLightVector[2]
            ];

            const len = Math.hypot(...tiltLightVector) || 1;
            const normTiltVector: [number, number, number] = [
              tiltLightVector[0] / len,
              tiltLightVector[1] / len,
              tiltLightVector[2] / len
            ];

            const activeMaterial = NailMaterialCatalog[materialKey] || NailMaterialCatalog.highGlossCrimson;
            const renderTransforms: RenderTransform[] = [];

            const identity4x4 = new Float32Array([
              1, 0, 0, 0,
              0, 1, 0, 0,
              0, 0, 1, 0,
              0, 0, 0, 1
            ]);

            const shapeScaleMultiplier = shape === 'Stiletto' ? 1.3 : shape === 'Coffin' ? 1.2 : 1.0;

            for (const nail of nailTransforms) {
              const isOccluded = occlusionMap.get(nail.finger);
              if (!isOccluded) {
                const modelMatrix = new Float32Array([
                  nail.scale.x * shapeScaleMultiplier, 0, 0, 0,
                  0, nail.scale.y * shapeScaleMultiplier, 0, 0,
                  0, 0, nail.scale.z, 0,
                  nail.center.x, nail.center.y, nail.center.z, 1
                ]);

                renderTransforms.push({
                  modelMatrix,
                  viewProjectionMatrix: identity4x4,
                  normalMatrix: identity4x4,
                  lightDirection: [
                    normTiltVector[0],
                    normTiltVector[1],
                    normTiltVector[2],
                    lighting.lightIntensity
                  ],
                  material: activeMaterial
                });
              }
            }

            renderer.render(renderTransforms);

            currentFrameData = {
              source: 'camera',
              landmarks: rawLandmarks.map(p => new Float32Array([p.x, p.y, p.z]))
            };
          }
        }
      } catch (err) {
        console.error('Error in AR frame loop tick:', err);
      } finally {
        if (currentFrameData) {
          MemorySanitizer.purgeFrame(currentFrameData);
          currentFrameData = null;
        }

        frameCount++;
        const now = performance.now();
        if (now - lastFpsCheck >= 1000) {
          setFps(Math.round((frameCount * 1000) / (now - lastFpsCheck)));
          frameCount = 0;
          lastFpsCheck = now;
        }

        if (isRunningRef.current) {
          animationFrameRef.current = requestAnimationFrame(loop);
        }
      }
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isReady, videoElement, canvasElement, materialKey, shape, gyroTilt]);

  return {
    isInitializing,
    isReady,
    fps,
    gyroTilt
  };
}
