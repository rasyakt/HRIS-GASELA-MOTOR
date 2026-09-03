'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  ExternalLink,
  Navigation,
  Copy,
  Check,
  Settings,
  Maximize2,
  Minimize2,
  MapPinOff,
} from 'lucide-react';
import type { OfficeLocationDto } from '@gasela/shared-types';
import { Button } from '@/components/ui/button';

interface CompanyLocationMapCardProps {
  location: OfficeLocationDto | null | undefined;
}

export function CompanyLocationMapCard({
  location,
}: CompanyLocationMapCardProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mapProvider, setMapProvider] = useState<'osm' | 'google'>('osm');

  if (!location || !location.lat || !location.lng) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-700">
              <MapPinOff className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Lokasi Kantor Belum Dikonfigurasi
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Atur titik koordinat pusat dan radius geofence untuk validasi presensi karyawan.
              </p>
            </div>
          </div>
          <Link href="/settings">
            <Button size="sm" variant="outline" className="text-xs h-8">
              <Settings className="size-3.5 mr-1.5 text-zinc-500" />
              Atur Lokasi
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { lat, lng, radiusMeters, companyName } = location;
  const coordText = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  // OpenStreetMap embed URL with bounding box around coordinates
  const delta = 0.004;
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}&layer=mapnik&marker=${lat}%2C${lng}`;
  // Google Maps embed URL
  const googleEmbedUrl = `https://maps.google.com/maps?q=${lat},${lng}&hl=id&z=16&output=embed`;

  const handleCopyCoord = () => {
    navigator.clipboard.writeText(coordText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-950 shadow-2xs transition-all duration-200 ${
        isExpanded ? 'ring-1 ring-zinc-300 dark:ring-zinc-700' : ''
      }`}
    >
      {/* Header - Clean, focused & uncluttered */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700">
            <MapPin className="size-4.5 text-zinc-800 dark:text-zinc-200" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                Lokasi Kantor &amp; Titik Presensi
              </h3>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Geofence Aktif
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
              {companyName} · Radius Presensi {radiusMeters} Meter
            </p>
          </div>
        </div>

        {/* Header Action Buttons (Simplified) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-2xs"
            title="Buka lokasi di Google Maps"
          >
            <ExternalLink className="size-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Buka Maps</span>
          </a>

          <Link href="/settings">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 px-2.5 gap-1.5 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-2xs"
            >
              <Settings className="size-3.5 text-zinc-400" />
              <span>Ubah Lokasi</span>
            </Button>
          </Link>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex size-8 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-2xs cursor-pointer"
            title={isExpanded ? 'Perkecil peta' : 'Perbesar peta'}
          >
            {isExpanded ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          </button>
        </div>
      </div>

      {/* Map Embed Container with In-Map Overlays */}
      <div className="relative mt-4 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 shadow-inner">
        <div
          className={`w-full transition-all duration-300 relative ${
            isExpanded ? 'h-96 md:h-120' : 'h-64 md:h-72'
          }`}
        >
          <iframe
            src={mapProvider === 'osm' ? osmEmbedUrl : googleEmbedUrl}
            title={`Peta Lokasi Kantor ${companyName}`}
            className="absolute inset-0 size-full border-0 dark:filter-[invert(0.88)_hue-rotate(180deg)_contrast(0.9)_saturate(0.65)]"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />

          {/* Floating HUD Badge - Top Left */}
          <div className="pointer-events-none absolute top-3 left-3 flex flex-wrap gap-2">
            <div className="pointer-events-auto flex items-center gap-2 rounded-lg border border-zinc-200/80 dark:border-zinc-700 bg-white/95 dark:bg-zinc-900/90 px-2.5 py-1.5 text-xs backdrop-blur-sm shadow-sm">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{companyName}</span>
              <span className="text-zinc-300 dark:text-zinc-600">|</span>
              <span className="text-zinc-500 dark:text-zinc-400 text-[11px] font-medium">Radius {radiusMeters}m</span>
            </div>
          </div>

          {/* Floating Map Provider Toggle - Top Right */}
          <div className="absolute top-3 right-3 flex items-center">
            <div className="inline-flex rounded-lg border border-zinc-200/80 dark:border-zinc-700/80 p-0.5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm shadow-sm text-xs">
              <button
                type="button"
                onClick={() => setMapProvider('osm')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  mapProvider === 'osm'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                OpenStreetMap
              </button>
              <button
                type="button"
                onClick={() => setMapProvider('google')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  mapProvider === 'google'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                Google Map
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Footer Grid */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Coordinate details with copy button */}
        <div className="flex items-center justify-between rounded-lg bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200/70 dark:border-zinc-800/80 p-3">
          <div className="min-w-0">
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
              Koordinat GPS
            </span>
            <span className="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate block mt-0.5">
              {coordText}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyCoord}
            className="ml-2 flex size-7 shrink-0 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors shadow-2xs cursor-pointer"
            title="Salin koordinat"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </button>
        </div>

        {/* Radius badge */}
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200/70 dark:border-zinc-800/80 p-3">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
            Radius Presensi (Geofence)
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              {radiusMeters} Meter
            </span>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
              (Batas Jangkauan)
            </span>
          </div>
        </div>

        {/* Petunjuk Rute Quick Action */}
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-lg bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200/70 dark:border-zinc-800/80 p-3 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 transition-colors group cursor-pointer"
        >
          <div>
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
              Navigasi Lokasi
            </span>
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block mt-0.5 group-hover:text-primary transition-colors">
              Petunjuk Rute Google Maps
            </span>
          </div>
          <Navigation className="size-4 text-zinc-400 group-hover:text-primary transition-colors ml-2 shrink-0" />
        </a>
      </div>
    </div>
  );
}
