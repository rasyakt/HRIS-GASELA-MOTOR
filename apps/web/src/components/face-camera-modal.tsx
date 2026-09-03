'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Camera, Check, CheckCircle2, Loader2, RefreshCw, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';

interface FaceCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (photoUrl: string) => void;
  title?: string;
  actionKind?: 'in' | 'out';
}

declare global {
  interface Window {
    FaceDetector?: new (options?: { maxDetectedFaces?: number; fastMode?: boolean }) => {
      detect(image: ImageBitmapSource): Promise<Array<{ boundingBox: DOMRectReadOnly }>>;
    };
  }
}

/**
 * Checks if human facial features are present in the central region of the video.
 * Uses native Chromium Shape Detection FaceDetector if available, with intelligent
 * YCbCr skin-tone & facial contrast analysis as an instant fallback.
 */
async function detectFaceInFrame(
  video: HTMLVideoElement,
  analyzerCanvas: HTMLCanvasElement,
): Promise<boolean> {
  if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
    return false;
  }

  // 1. Try Native Browser FaceDetector API (Chrome, Edge, Android Chrome, Opera)
  if (typeof window !== 'undefined' && window.FaceDetector) {
    try {
      const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
      const faces = await detector.detect(video);
      if (faces && faces.length > 0) {
        const face = faces[0].boundingBox;
        // Verify face is reasonably sized and centered
        const minSize = Math.min(video.videoWidth, video.videoHeight) * 0.2;
        if (face.width >= minSize && face.height >= minSize) {
          return true;
        }
      }
    } catch {
      // Fallback to pixel analysis below if native detector errors
    }
  }

  // 2. High-speed Anthropometric & YCbCr Skin Chroma + Contrast Analyzer
  const width = 80;
  const height = 80;
  analyzerCanvas.width = width;
  analyzerCanvas.height = height;
  const ctx = analyzerCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return false;

  ctx.drawImage(video, 0, 0, width, height);
  const frame = ctx.getImageData(0, 0, width, height);
  const data = frame.data;

  let skinPixelsInCenter = 0;
  let totalCenterPixels = 0;
  let upperLuminance = 0;
  let upperCount = 0;
  let lowerLuminance = 0;
  let lowerCount = 0;

  // Center elliptical region (30% to 70% of frame)
  const cx = width / 2;
  const cy = height / 2;
  const rx = width * 0.28;
  const ry = height * 0.35;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Check if point is inside the oval
      const normX = (x - cx) / rx;
      const normY = (y - cy) / ry;
      if (normX * normX + normY * normY <= 1.0) {
        totalCenterPixels++;
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Standard ITU-R BT.601 RGB to YCbCr conversion
        const Y = 0.299 * r + 0.587 * g + 0.114 * b;
        const Cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
        const Cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

        // Human skin tone chroma range: Cb in [77, 130], Cr in [130, 175], moderate light
        const isSkin =
          Cb >= 77 &&
          Cb <= 130 &&
          Cr >= 130 &&
          Cr <= 175 &&
          Y >= 35 &&
          Y <= 245 &&
          r > g &&
          g > b * 0.7;

        if (isSkin) {
          skinPixelsInCenter++;
        }

        // Measure facial gradient (upper eye region vs mid cheek)
        if (y >= height * 0.3 && y <= height * 0.45) {
          upperLuminance += Y;
          upperCount++;
        } else if (y >= height * 0.48 && y <= height * 0.65) {
          lowerLuminance += Y;
          lowerCount++;
        }
      }
    }
  }

  const skinRatio = skinPixelsInCenter / Math.max(1, totalCenterPixels);
  const avgUpperY = upperCount > 0 ? upperLuminance / upperCount : 0;
  const avgLowerY = lowerCount > 0 ? lowerLuminance / lowerCount : 0;

  // A human face in the guide oval requires:
  // - Significant skin coverage (between 25% and 85%)
  // - Not a plain solid wall (has facial contrast between eye/eyebrow sockets and cheeks/forehead)
  const hasFacialContrast = Math.abs(avgLowerY - avgUpperY) >= 2.5 || skinRatio >= 0.35;
  return skinRatio >= 0.26 && skinRatio <= 0.88 && hasFacialContrast;
}

export function FaceCameraModal({
  isOpen,
  onClose,
  onCapture,
  title = 'Verifikasi Wajah',
  actionKind = 'in',
}: FaceCameraModalProps) {
  const token = useAuthStore((s) => s.accessToken);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyzerCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Initialize hidden analyzer canvas on mount
  useEffect(() => {
    if (!analyzerCanvasRef.current && typeof document !== 'undefined') {
      const c = document.createElement('canvas');
      c.width = 80;
      c.height = 80;
      analyzerCanvasRef.current = c;
    }
  }, []);

  // Initialize camera stream
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedPhoto(null);
      setCapturedBlob(null);
      setCameraError(null);
      setIsFaceDetected(false);
      setCountdown(null);
      return;
    }

    let isMounted = true;

    async function startCamera() {
      setCameraError(null);
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Kamera tidak didukung oleh browser Anda.');
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 640 },
          },
          audio: false,
        });

        if (isMounted) {
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            await videoRef.current.play().catch(() => {});
          }
        } else {
          mediaStream.getTracks().forEach((t) => t.stop());
        }
      } catch (err) {
        if (isMounted) {
          const msg =
            err instanceof Error
              ? err.name === 'NotAllowedError'
                ? 'Izin kamera ditolak. Mohon berikan akses kamera pada browser.'
                : err.message
              : 'Gagal mengakses kamera.';
          setCameraError(msg);
        }
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [isOpen]);

  // Real-time Face Detection Loop
  useEffect(() => {
    if (!isOpen || capturedPhoto || !stream) {
      return;
    }

    let active = true;
    const interval = setInterval(async () => {
      if (!active || !videoRef.current || !analyzerCanvasRef.current) return;
      const detected = await detectFaceInFrame(
        videoRef.current,
        analyzerCanvasRef.current,
      );
      if (active) {
        setIsFaceDetected(detected);
      }
    }, 250);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isOpen, capturedPhoto, stream]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleSnap = () => {
    if (!videoRef.current) return;
    if (!isFaceDetected) return; // Strict: face must be detected

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mirror image for natural selfie orientation
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setCapturedPhoto(dataUrl);
          stopCamera();
        }
      },
      'image/jpeg',
      0.85,
    );
  };

  const startAutoCaptureCountdown = () => {
    if (!isFaceDetected) return;
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          handleSnap();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleRetake = async () => {
    setCapturedPhoto(null);
    setCapturedBlob(null);
    setCountdown(null);
    setCameraError(null);
    setIsFaceDetected(false);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      setCameraError('Gagal membuka kembali kamera.');
    }
  };

  const handleConfirmAndUpload = async () => {
    if (!capturedBlob) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      const file = new File(
        [capturedBlob],
        `attendance_${actionKind}_${Date.now()}.jpg`,
        { type: 'image/jpeg' },
      );
      formData.append('file', file);
      formData.append('category', 'attendance');

      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch('/api/uploads', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.message || 'Gagal mengunggah foto presensi.',
        );
      }

      const data = await res.json();
      const photoUrl = data.data?.url || data.url;

      if (!photoUrl) {
        throw new Error('URL foto tidak diterima dari server.');
      }

      onCapture(photoUrl);
      onClose();
    } catch (err) {
      setCameraError(
        err instanceof Error ? err.message : 'Terjadi kesalahan saat upload foto.',
      );
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm overflow-hidden rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              <User className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-none">
                {title}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {actionKind === 'in' ? 'Presensi Masuk' : 'Presensi Keluar'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Viewfinder Content */}
        <div className="p-5 flex flex-col items-center">
          {cameraError ? (
            <div className="flex flex-col items-center justify-center gap-2.5 py-10 px-4 text-center">
              <div className="size-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                <Camera className="size-5" />
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-xs">{cameraError}</p>
              <Button
                size="xs"
                variant="outline"
                onClick={handleRetake}
                className="mt-2 text-xs"
              >
                <RefreshCw className="size-3 mr-1.5" />
                Coba Lagi
              </Button>
            </div>
          ) : (
            <div className="space-y-3 w-full flex flex-col items-center">
              <div className="relative aspect-square w-full max-w-70 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 shadow-xs">
                {!capturedPhoto ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="h-full w-full object-cover -scale-x-100"
                    />

                    {/* Minimalist Face Detection Guide Frame */}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div
                        className={`h-[78%] w-[68%] rounded-full transition-all duration-300 flex items-center justify-center ${
                          isFaceDetected
                            ? 'border-2 border-emerald-400/90 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                            : 'border border-dashed border-red-400/80 shadow-xs'
                        }`}
                      >
                        {countdown !== null && (
                          <div className="flex size-14 items-center justify-center rounded-full bg-black/60 text-2xl font-bold text-white backdrop-blur-xs">
                            {countdown}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Real-time Status Badge Indicator */}
                    <div className="absolute top-3 inset-x-0 flex justify-center pointer-events-none">
                      {isFaceDetected ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/85 px-3 py-1 text-[11px] font-medium text-emerald-300 border border-emerald-500/40 backdrop-blur-xs shadow-xs animate-in fade-in duration-200">
                          <CheckCircle2 className="size-3 text-emerald-400" />
                          Wajah Terdeteksi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-950/85 px-3 py-1 text-[11px] font-medium text-red-300 border border-red-500/40 backdrop-blur-xs shadow-xs animate-in fade-in duration-200">
                          <AlertCircle className="size-3 text-red-400" />
                          Wajah Belum Terdeteksi
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="relative h-full w-full">
                    <img
                      src={capturedPhoto}
                      alt="Foto Presensi"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute top-3 inset-x-0 flex justify-center">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/85 px-3 py-1 text-[11px] font-medium text-emerald-300 border border-emerald-500/40 backdrop-blur-xs">
                        <Check className="size-3" />
                        Foto Siap Digunakan
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                {!capturedPhoto
                  ? isFaceDetected
                    ? 'Wajah siap! Silakan tekan tombol Ambil Foto'
                    : 'Arahkan wajah Anda tepat ke dalam lingkaran panduan'
                  : 'Pastikan wajah Anda terlihat jelas pada foto'}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/70 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
          {!capturedPhoto ? (
            <div className="flex w-full items-center justify-between gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={startAutoCaptureCountdown}
                disabled={!!cameraError || !isFaceDetected || countdown !== null}
                className="text-xs"
              >
                Timer 3s
              </Button>
              <Button
                size="sm"
                onClick={handleSnap}
                disabled={!!cameraError || !isFaceDetected}
                className={`text-xs gap-1.5 transition-all ${
                  isFaceDetected
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <Camera className="size-3.5" />
                Ambil Foto
              </Button>
            </div>
          ) : (
            <div className="flex w-full items-center justify-between gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetake}
                disabled={isUploading}
                className="text-xs"
              >
                <RefreshCw className="size-3.5 mr-1" />
                Ulangi
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmAndUpload}
                disabled={isUploading}
                className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Memproses…
                  </>
                ) : (
                  <>
                    <Check className="size-3.5" />
                    Gunakan Foto
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
