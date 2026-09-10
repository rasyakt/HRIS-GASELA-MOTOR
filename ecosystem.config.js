/**
 * ecosystem.config.js — PM2 Production Configuration
 *
 * Cara deploy:
 *   1. Build: pnpm --filter backend build
 *   2. Start: pm2 start ecosystem.config.js --env production
 *   3. Monitor: pm2 monit
 *   4. Auto-restart on reboot: pm2 startup && pm2 save
 *
 * Untuk 1.000+ user/hari dengan absensi bersamaan:
 *   - Backend berjalan di semua CPU core (cluster mode)
 *   - Setiap instance punya worker pool face detection (2-8 thread per core)
 *   - Total kapasitas concurrent face detection: (jumlah CPU) x (thread per pool)
 */
module.exports = {
  apps: [
    {
      name: 'gasela-backend',
      script: 'apps/backend/dist/main.js',
      cwd: '/var/www/gasela', // Ganti sesuai path VPS Anda

      // ========= CLUSTER MODE =========
      // 'max' = gunakan semua core CPU yang tersedia
      // Jika VPS 4 core → 4 proses berjalan paralel
      instances: 'max',
      exec_mode: 'cluster',

      // ========= ENVIRONMENT =========
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        TZ: 'Asia/Jakarta',
      },

      // ========= MEMORY & RESTART =========
      // Restart otomatis jika memory melebihi 512MB per instance
      max_memory_restart: '512M',
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '10s',

      // ========= LOGGING =========
      out_file: './logs/backend-out.log',
      error_file: './logs/backend-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // ========= GRACEFUL SHUTDOWN =========
      // Beri waktu 10 detik agar request yang sedang berjalan selesai
      kill_timeout: 10000,
      listen_timeout: 10000,

      // ========= NODE.JS FLAGS =========
      node_args: [
        '--max-old-space-size=512', // Batas heap 512MB per process
        '--expose-gc',              // Izinkan manual GC jika diperlukan
      ],
    },
  ],
};
