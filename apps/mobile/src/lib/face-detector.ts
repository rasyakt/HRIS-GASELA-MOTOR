import * as jpeg from 'jpeg-js';
import { detectHumanFaces } from './pico-detector';

const B64_LOOKUP = new Uint8Array(256);
const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
for (let i = 0; i < B64_CHARS.length; i++) {
  B64_LOOKUP[B64_CHARS.charCodeAt(i)] = i;
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const clean = base64.replace(/^data:image\/\w+;base64,/, '').replace(/[\r\n\s]/g, '');
  const len = clean.length;
  if (len === 0) return new Uint8Array(0);

  let placeHolders = 0;
  if (clean[len - 1] === '=') placeHolders++;
  if (clean[len - 2] === '=') placeHolders++;

  const byteLen = Math.floor((len * 3) / 4) - placeHolders;
  const bytes = new Uint8Array(byteLen);

  let curByte = 0;
  for (let i = 0; i < len; i += 4) {
    const a = B64_LOOKUP[clean.charCodeAt(i)];
    const b = B64_LOOKUP[clean.charCodeAt(i + 1)];
    const c = B64_LOOKUP[clean.charCodeAt(i + 2)];
    const d = B64_LOOKUP[clean.charCodeAt(i + 3)];

    bytes[curByte++] = (a << 2) | (b >> 4);
    if (curByte < byteLen) bytes[curByte++] = ((b & 15) << 4) | (c >> 2);
    if (curByte < byteLen) bytes[curByte++] = ((c & 3) << 6) | (d & 63);
  }

  return bytes;
}

export interface ClientFaceCheckResult {
  hasFace: boolean;
  skinRatio: number;
  facialContrast: number;
  reason?: string;
}

/**
 * Ultra-fast on-device human face detector using Pico decision tree cascade.
 * Accurately detects human facial features (eyes, nose, mouth structure).
 * Rejects ceilings, walls, lamps, yellow objects, and floors (score = 0).
 */
export function detectFaceFromBase64(base64: string): ClientFaceCheckResult {
  try {
    const bytes = base64ToUint8Array(base64);
    if (!bytes || bytes.length === 0) {
      return { hasFace: false, skinRatio: 0, facialContrast: 0, reason: 'Gambar tidak valid' };
    }

    const decoded = jpeg.decode(bytes, { useTArray: true, formatAsRGBA: true });
    if (!decoded || !decoded.data || decoded.width === 0 || decoded.height === 0) {
      return { hasFace: false, skinRatio: 0, facialContrast: 0, reason: 'Format gambar tidak terbaca' };
    }

    const { width, height, data } = decoded;

    // 1. Downsample to target width 200 for fast Pico evaluation on mobile (~10ms)
    const targetW = 200;
    const scale = width / targetW;
    const targetH = Math.round(height / scale);
    const grayPixels = new Uint8Array(targetW * targetH);

    for (let y = 0; y < targetH; y++) {
      const srcY = Math.min(height - 1, Math.round(y * scale));
      for (let x = 0; x < targetW; x++) {
        const srcX = Math.min(width - 1, Math.round(x * scale));
        const idx = (srcY * width + srcX) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        grayPixels[y * targetW + x] = (r * 77 + g * 150 + b * 29) >> 8;
      }
    }

    // 2. Run Pico decision tree face detector (detects actual facial geometry: eyes, nose, mouth)
    const faceDetections = detectHumanFaces(grayPixels, targetW, targetH, {
      scoreThreshold: 2.5,
      minSize: Math.round(Math.min(targetW, targetH) * 0.18),
      maxSize: Math.round(Math.min(targetW, targetH) * 0.90),
    });

    if (faceDetections.length === 0) {
      return {
        hasFace: false,
        skinRatio: 0,
        facialContrast: 0,
        reason:
          'Tidak terdeteksi wajah manusia pada foto. Mohon arahkan kamera tepat ke wajah Anda, bukan ke plafon, dinding, atau benda lain.',
      };
    }

    const topFace = faceDetections[0];

    // 3. Photometric verification in central oval (overexposure / darkness guards)
    const cx = width / 2;
    const cy = height * 0.48;
    const rx = width * 0.32;
    const ry = height * 0.38;

    let skinPixelsInCenter = 0;
    let totalCenterPixels = 0;
    let totalLuminance = 0;
    const step = Math.max(2, Math.floor(Math.min(width, height) / 70));

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const normX = (x - cx) / rx;
        const normY = (y - cy) / ry;

        if (normX * normX + normY * normY <= 1.0) {
          totalCenterPixels++;
          const idx = (y * width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          const Y = 0.299 * r + 0.587 * g + 0.114 * b;
          const Cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
          const Cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

          totalLuminance += Y;

          if (
            Cb >= 75 &&
            Cb <= 135 &&
            Cr >= 125 &&
            Cr <= 180 &&
            Y >= 25 &&
            Y <= 250 &&
            r > g &&
            g > b * 0.55
          ) {
            skinPixelsInCenter++;
          }
        }
      }
    }

    const avgLuminance = totalCenterPixels > 0 ? totalLuminance / totalCenterPixels : 0;
    const skinRatio = totalCenterPixels > 0 ? skinPixelsInCenter / totalCenterPixels : 0;

    // Guard: Overexposed (lampu/senter/layar putih langsung diarahkan ke kamera)
    if (avgLuminance > 220) {
      return {
        hasFace: false,
        skinRatio,
        facialContrast: 0,
        reason: 'Gambar terlalu terang (overexposed). Hindari lampu langsung dan pastikan pencahayaan merata.',
      };
    }

    // Guard: Terlalu gelap untuk dideteksi
    if (avgLuminance < 18) {
      return {
        hasFace: false,
        skinRatio,
        facialContrast: 0,
        reason: 'Gambar terlalu gelap. Pastikan wajah Anda mendapat pencahayaan yang cukup.',
      };
    }

    return {
      hasFace: true,
      skinRatio,
      facialContrast: topFace.score,
    };
  } catch (err: any) {
    console.warn('detectFaceFromBase64 exception:', err);
    return { hasFace: false, skinRatio: 0, facialContrast: 0, reason: err.message };
  }
}
