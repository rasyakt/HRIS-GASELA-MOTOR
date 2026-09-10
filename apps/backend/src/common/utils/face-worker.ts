/**
 * face-worker.ts
 *
 * Dijalankan di dalam Node.js Worker Thread yang terpisah dari main thread.
 * Berjalan dalam mode PERSISTENT (reusable) — menunggu pesan dari main thread via
 * parentPort.on('message'), memproses face detection, dan membalas hasilnya.
 * Ini memastikan Event Loop utama tidak pernah terblokir.
 */
import { parentPort } from 'worker_threads';
import { validateHumanFaceInImage } from './face-validator.util';

if (!parentPort) {
  process.exit(1);
}

// Persistent listener: satu worker bisa digunakan berulang kali oleh pool
parentPort.on('message', (msg: { buffer: Buffer }) => {
  try {
    const buffer = Buffer.from(msg.buffer);
    const result = validateHumanFaceInImage(buffer);
    parentPort!.postMessage({ success: true, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    parentPort!.postMessage({ success: false, error: message });
  }
});

