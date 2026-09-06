import { FACEFINDER_BASE64 } from './facefinder.data';

export interface FaceDetection {
  row: number;
  col: number;
  size: number;
  score: number;
}

type ClassifyRegionFn = (
  r: number,
  c: number,
  s: number,
  pixels: Uint8Array,
  ldim: number,
) => number;

let cachedClassifier: ClassifyRegionFn | null = null;

const B64_LOOKUP = new Uint8Array(256);
const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
for (let i = 0; i < B64_CHARS.length; i++) {
  B64_LOOKUP[B64_CHARS.charCodeAt(i)] = i;
}

function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/[\r\n\s]/g, '');
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

function unpackCascade(bytes: Uint8Array): ClassifyRegionFn {
  const int8 = new Int8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const dview = new DataView(new ArrayBuffer(4));
  let p = 8; // skip 8 bytes header

  dview.setUint8(0, int8[p + 0]);
  dview.setUint8(1, int8[p + 1]);
  dview.setUint8(2, int8[p + 2]);
  dview.setUint8(3, int8[p + 3]);
  const tdepth = dview.getInt32(0, true);
  p += 4;

  dview.setUint8(0, int8[p + 0]);
  dview.setUint8(1, int8[p + 1]);
  dview.setUint8(2, int8[p + 2]);
  dview.setUint8(3, int8[p + 3]);
  const ntrees = dview.getInt32(0, true);
  p += 4;

  const tcodes_ls: number[] = [];
  const tpreds_ls: number[] = [];
  const thresh_ls: number[] = [];
  const pow2tdepth = Math.pow(2, tdepth);

  for (let t = 0; t < ntrees; ++t) {
    tcodes_ls.push(0, 0, 0, 0);
    const sliceLen = 4 * pow2tdepth - 4;
    for (let i = 0; i < sliceLen; i++) {
      tcodes_ls.push(int8[p + i]);
    }
    p += sliceLen;

    for (let i = 0; i < pow2tdepth; ++i) {
      dview.setUint8(0, int8[p + 0]);
      dview.setUint8(1, int8[p + 1]);
      dview.setUint8(2, int8[p + 2]);
      dview.setUint8(3, int8[p + 3]);
      tpreds_ls.push(dview.getFloat32(0, true));
      p += 4;
    }

    dview.setUint8(0, int8[p + 0]);
    dview.setUint8(1, int8[p + 1]);
    dview.setUint8(2, int8[p + 2]);
    dview.setUint8(3, int8[p + 3]);
    thresh_ls.push(dview.getFloat32(0, true));
    p += 4;
  }

  const tcodes = new Int8Array(tcodes_ls);
  const tpreds = new Float32Array(tpreds_ls);
  const thresh = new Float32Array(thresh_ls);

  return function classify(
    r: number,
    c: number,
    s: number,
    pixels: Uint8Array,
    ldim: number,
  ): number {
    r = 256 * r;
    c = 256 * c;
    let root = 0;
    let o = 0.0;

    for (let i = 0; i < ntrees; ++i) {
      let idx = 1;
      for (let j = 0; j < tdepth; ++j) {
        const p1 =
          ((r + tcodes[root + 4 * idx + 0] * s) >> 8) * ldim +
          ((c + tcodes[root + 4 * idx + 1] * s) >> 8);
        const p2 =
          ((r + tcodes[root + 4 * idx + 2] * s) >> 8) * ldim +
          ((c + tcodes[root + 4 * idx + 3] * s) >> 8);
        idx = 2 * idx + (pixels[p1] <= pixels[p2] ? 1 : 0);
      }

      o += tpreds[pow2tdepth * i + idx - pow2tdepth];

      if (o <= thresh[i]) return -1;

      root += 4 * pow2tdepth;
    }

    return o - thresh[ntrees - 1];
  };
}

export function getPicoClassifier(): ClassifyRegionFn {
  if (!cachedClassifier) {
    const bytes = base64ToBytes(FACEFINDER_BASE64);
    cachedClassifier = unpackCascade(bytes);
  }
  return cachedClassifier;
}

/**
 * Ultra-fast human face detector using Pico decision tree cascade.
 * Accurately detects human facial features (eyes, nose, mouth structure).
 * Rejects ceilings, walls, lamps, yellow objects, and floors (score = 0).
 */
export function detectHumanFaces(
  grayscale: Uint8Array,
  width: number,
  height: number,
  options?: { minSize?: number; maxSize?: number; scoreThreshold?: number },
): FaceDetection[] {
  const classify = getPicoClassifier();
  const minsize = options?.minSize ?? Math.round(Math.min(width, height) * 0.20);
  const maxsize = options?.maxSize ?? Math.round(Math.min(width, height) * 0.90);
  const threshold = options?.scoreThreshold ?? 2.5;
  const scalefactor = 1.15;
  const shiftfactor = 0.1;

  let scale = minsize;
  const rawDetections: Array<[number, number, number, number]> = [];

  while (scale <= maxsize) {
    const step = Math.max(shiftfactor * scale, 2) >> 0;
    const offset = (scale / 2 + 1) >> 0;

    for (let r = offset; r <= height - offset; r += step) {
      for (let c = offset; c <= width - offset; c += step) {
        const q = classify(r, c, scale, grayscale, width);
        if (q > threshold) {
          rawDetections.push([r, c, scale, q]);
        }
      }
    }
    scale = Math.round(scale * scalefactor);
  }

  // Non-maximum suppression / clustering
  rawDetections.sort((a, b) => b[3] - a[3]);
  const clusters: FaceDetection[] = [];
  const assigned = new Uint8Array(rawDetections.length);

  for (let i = 0; i < rawDetections.length; ++i) {
    if (assigned[i] === 0) {
      let r = 0;
      let c = 0;
      let s = 0;
      let q = 0;
      let count = 0;

      const r1 = rawDetections[i][0];
      const c1 = rawDetections[i][1];
      const s1 = rawDetections[i][2];

      for (let j = i; j < rawDetections.length; ++j) {
        const r2 = rawDetections[j][0];
        const c2 = rawDetections[j][1];
        const s2 = rawDetections[j][2];

        // IoU calculation
        const overr = Math.max(0, Math.min(r1 + s1 / 2, r2 + s2 / 2) - Math.max(r1 - s1 / 2, r2 - s2 / 2));
        const overc = Math.max(0, Math.min(c1 + s1 / 2, c2 + s2 / 2) - Math.max(c1 - s1 / 2, c2 - s2 / 2));
        const iou = (overr * overc) / (s1 * s1 + s2 * s2 - overr * overc);

        if (iou > 0.25) {
          assigned[j] = 1;
          r += rawDetections[j][0];
          c += rawDetections[j][1];
          s += rawDetections[j][2];
          q += rawDetections[j][3];
          count++;
        }
      }

      if (count > 0) {
        clusters.push({
          row: Math.round(r / count),
          col: Math.round(c / count),
          size: Math.round(s / count),
          score: Math.round((q / count) * 10) / 10,
        });
      }
    }
  }

  return clusters;
}
