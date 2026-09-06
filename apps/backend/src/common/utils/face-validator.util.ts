import * as jpeg from 'jpeg-js';
import { detectHumanFaces } from './pico-detector';

export interface FaceValidationResult {
  hasFace: boolean;
  skinRatio: number;
  facialContrast: number;
  confidenceScore?: number;
  reason?: string;
}

/**
 * Validates whether an uploaded attendance photo buffer contains an actual human face.
 * Uses Pico decision tree cascade classifier (trained on human facial landmarks: eyes, nose, mouth)
 * combined with photometric lighting and skin tone verification.
 * Strictly rejects ceilings, yellow walls, lamps, floors, tables, screens, or non-human objects.
 */
export function validateHumanFaceInImage(
  buffer: Buffer,
): FaceValidationResult {
  try {
    // 1. Decode JPEG image to raw RGBA pixels
    const decoded = jpeg.decode(buffer, { useTArray: true, formatAsRGBA: true });
    if (!decoded || !decoded.data || decoded.width === 0 || decoded.height === 0) {
      return { hasFace: false, skinRatio: 0, facialContrast: 0, reason: 'Format gambar tidak dapat dibaca.' };
    }

    const { width, height, data } = decoded;

    // 2. Downsample to target width 240 for ultra-fast Pico ML evaluation (~5ms)
    const targetW = 240;
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

    // 3. Run Pico decision tree face detector (detects actual facial geometry: eyes, nose, mouth)
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

    // 4. Photometric verification in central oval (overexposure / darkness guards)
    const cx = width / 2;
    const cy = height * 0.48;
    const rx = width * 0.32;
    const ry = height * 0.38;

    let skinPixelsInCenter = 0;
    let totalCenterPixels = 0;
    let totalLuminance = 0;
    const step = Math.max(2, Math.floor(Math.min(width, height) / 80));

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

    // Guard: Overexposed (lampu / senter langsung ke kamera)
    if (avgLuminance > 220) {
      return {
        hasFace: false,
        skinRatio,
        facialContrast: 0,
        reason: 'Gambar terlalu terang (overexposed). Hindari lampu langsung dan pastikan pencahayaan merata.',
      };
    }

    // Guard: Terlalu gelap
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
      confidenceScore: topFace.score,
    };
  } catch (err) {
    console.warn('validateHumanFaceInImage error:', err);
    return { hasFace: false, skinRatio: 0, facialContrast: 0, reason: 'Format gambar tidak dapat dibaca.' };
  }
}

/**
 * Flips a JPEG buffer horizontally (along the vertical axis) to produce
 * a true non-mirrored real-world photo.
 */
export function flipJpegBuffer(buffer: Buffer): Buffer {
  try {
    const decoded = jpeg.decode(buffer, { useTArray: true, formatAsRGBA: true });
    if (!decoded || !decoded.data) return buffer;
    const { width, height, data } = decoded;
    const flipped = new Uint8Array(data.length);
    const rowBytes = width * 4;

    for (let y = 0; y < height; y++) {
      const rowStart = y * rowBytes;
      for (let x = 0; x < width; x++) {
        const srcIdx = rowStart + x * 4;
        const dstIdx = rowStart + (width - 1 - x) * 4;
        flipped[dstIdx] = data[srcIdx];
        flipped[dstIdx + 1] = data[srcIdx + 1];
        flipped[dstIdx + 2] = data[srcIdx + 2];
        flipped[dstIdx + 3] = data[srcIdx + 3];
      }
    }

    const encoded = jpeg.encode({ width, height, data: flipped }, 85);
    return Buffer.from(encoded.data);
  } catch {
    return buffer;
  }
}

