import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CV GASELA GROUP — GaselaPulse',
    short_name: 'Gasela Group',
    description:
      'Portal Resmi CV GASELA GROUP & Sistem Informasi Manajemen HRIS GaselaPulse Cikoneng, Ciamis.',
    start_url: '/',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#09090b',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
