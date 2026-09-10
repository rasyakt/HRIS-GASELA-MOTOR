/**
 * face-worker-pool.ts
 *
 * Pool Worker Thread untuk face detection. Mengelola sejumlah thread tetap agar:
 * 1. Main event loop TIDAK PERNAH terblokir oleh CPU-intensive face detection
 * 2. Permintaan concurrent diproses secara paralel sesuai jumlah CPU
 * 3. Setiap request mendapat timeout agar tidak menggantung selamanya
 *
 * Penggunaan:
 *   const pool = FaceWorkerPool.getInstance();
 *   const result = await pool.validate(imageBuffer);
 */
import { Worker } from 'worker_threads';
import { join } from 'path';
import { cpus } from 'os';
import type { FaceValidationResult } from './face-validator.util';

interface PendingTask {
  resolve: (result: FaceValidationResult) => void;
  reject: (err: Error) => void;
  buffer: Buffer;
  timer: NodeJS.Timeout;
}

const WORKER_TIMEOUT_MS = 15_000; // 15 detik maksimum per request
const POOL_SIZE = Math.max(2, Math.min(cpus().length, 8)); // 2–8 thread sesuai CPU

export class FaceWorkerPool {
  private static instance: FaceWorkerPool;

  private readonly workers: Worker[] = [];
  private readonly queue: PendingTask[] = [];
  private readonly idle: Worker[] = [];

  private constructor() {
    // Di production (dist/): file sudah dikompilasi menjadi face-worker.js
    // Di development (ts-node): gunakan flag execArgv agar TypeScript dijalankan langsung
    const isCompiled = __filename.endsWith('.js');
    const workerFile = isCompiled
      ? join(__dirname, 'face-worker.js')
      : join(__dirname, 'face-worker.ts');

    for (let i = 0; i < POOL_SIZE; i++) {
      this.spawnWorker(workerFile, !isCompiled);
    }
  }

  static getInstance(): FaceWorkerPool {
    if (!FaceWorkerPool.instance) {
      FaceWorkerPool.instance = new FaceWorkerPool();
    }
    return FaceWorkerPool.instance;
  }

  private spawnWorker(workerFile: string, useTsNode = false): Worker {
    const workerOptions = useTsNode
      ? { execArgv: ['-r', 'ts-node/register', '-r', 'tsconfig-paths/register'] }
      : {};

    const worker = new Worker(workerFile, workerOptions);
    worker.on('error', (err) => {
      // Worker crash: log dan spawn ulang secara otomatis
      console.error('[FaceWorkerPool] Worker error, respawning:', err.message);
      const idx = this.workers.indexOf(worker);
      if (idx !== -1) this.workers.splice(idx, 1);
      const idleIdx = this.idle.indexOf(worker);
      if (idleIdx !== -1) this.idle.splice(idleIdx, 1);
      this.spawnWorker(workerFile, useTsNode);
    });
    this.workers.push(worker);
    this.idle.push(worker);
    return worker;
  }

  private dispatch(worker: Worker, task: PendingTask): void {
    // Buat listener sekali pakai untuk satu task
    const onMessage = (msg: { success: boolean; result?: FaceValidationResult; error?: string }) => {
      clearTimeout(task.timer);
      worker.removeListener('message', onMessage);

      if (msg.success && msg.result) {
        task.resolve(msg.result);
      } else {
        task.reject(new Error(msg.error ?? 'Face worker gagal'));
      }

      // Setelah selesai, cek antrian atau kembalikan ke idle
      if (this.queue.length > 0) {
        const next = this.queue.shift()!;
        this.dispatch(worker, next);
      } else {
        this.idle.push(worker);
      }
    };

    worker.on('message', onMessage);

    // Transfer buffer ke worker melalui workerData-style posting
    // Kita gunakan postMessage agar tidak perlu re-spawn worker per task
    // Catatan: Worker Thread ini bersifat persistent (reusable), bukan sekali pakai
    worker.postMessage({ buffer: task.buffer });
  }

  /**
   * Validasi wajah secara async di thread terpisah.
   * Jika semua thread sibuk, request dimasukkan antrian dan diproses FIFO.
   */
  validate(buffer: Buffer): Promise<FaceValidationResult> {
    return new Promise<FaceValidationResult>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Face detection timeout (>15s). Coba lagi dengan foto yang lebih kecil.'));
      }, WORKER_TIMEOUT_MS);

      const task: PendingTask = { resolve, reject, buffer, timer };

      if (this.idle.length > 0) {
        const worker = this.idle.pop()!;
        this.dispatch(worker, task);
      } else {
        // Semua thread sibuk — masukkan antrian
        this.queue.push(task);
      }
    });
  }

  /** Jumlah thread aktif dan panjang antrian — untuk monitoring/health check */
  status() {
    return {
      poolSize: POOL_SIZE,
      idleWorkers: this.idle.length,
      busyWorkers: POOL_SIZE - this.idle.length,
      queuedTasks: this.queue.length,
    };
  }
}
