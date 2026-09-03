import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Multi-Domain & Subdomain Routing Middleware for CV GASELA GROUP.
 * ──────────────────────────────────────────────────────────────────
 * Allows each business unit to have its own domain (e.g. www.makaronikantawes.com)
 * or subdomain (e.g. makaroni.gaselagroup.com) while staying within 1 Next.js codebase.
 */

const DOMAIN_TO_UNIT_MAP: Record<string, string> = {
  // Local Development Subdomain Simulations (localhost:3000)
  'makaroni.localhost': 'makaronikantawes',
  'motor.localhost': 'motor',
  'futsal.localhost': 'futsal',
  'sellular.localhost': 'sellular',

  // Makaroni Cap Ikan Tawes (Production)
  'makaronikantawes.com': 'makaronikantawes',
  'www.makaronikantawes.com': 'makaronikantawes',
  'makaroni.gaselagroup.com': 'makaronikantawes',

  // Gasela Motor (Production)
  'gaselamotor.com': 'motor',
  'www.gaselamotor.com': 'motor',
  'motor.gaselagroup.com': 'motor',

  // Gasela Futsal Stadium (Production)
  'gaselafutsal.com': 'futsal',
  'www.gaselafutsal.com': 'futsal',
  'futsal.gaselagroup.com': 'futsal',

  // Gasela Sellular & Plastik (Production)
  'gaselasellular.com': 'sellular',
  'www.gaselasellular.com': 'sellular',
  'sellular.gaselagroup.com': 'sellular',
};

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const cleanHost = hostname.split(':')[0].toLowerCase();

  // Check if incoming domain/subdomain belongs to a specific business unit
  const unitId = DOMAIN_TO_UNIT_MAP[cleanHost];

  if (unitId) {
    const { pathname, search } = request.nextUrl;

    // BUG-010 FIX: Rewrite SEMUA path unit bisnis, bukan hanya root '/'
    // Sebelumnya: motor.localhost/about → NextResponse.next() → tampilkan HRIS,
    //             bukan halaman about landing unit Motor
    // Sekarang: motor.localhost/about → /landing/unit/motor/about ✓
    //
    // BUG-022 NOTE: file .webmanifest & sejenisnya sudah di-exclude oleh matcher
    // pattern '.*\\..*' (ekstensi apapun tidak masuk middleware)
    return NextResponse.rewrite(
      new URL(`/landing/unit/${unitId}${pathname}${search}`, request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  // Exclude: API routes, Next.js static files, image optimization,
  // favicon, manifest, robots, sitemap, dan semua file dengan ekstensi
  // BUG-022 FIX: Eksplisit exclude manifest.webmanifest agar tidak tertangkap oleh sub-unit routing
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|robots.txt|sitemap.xml|.*\\..*).*)'],
};
