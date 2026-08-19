import { BadRequestException, Injectable } from '@nestjs/common';
import {
  DEFAULT_LANDING_CONTENT,
  LANDING_SECTIONS,
  landingAboutSchema,
  landingContactSchema,
  landingFooterSchema,
  landingHeroSchema,
  landingMarqueeSchema,
  landingNavSchema,
  landingPortfolioSchema,
  type LandingContent,
  type LandingSection,
} from '@gasela/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

const SECTION_SCHEMAS = {
  nav: landingNavSchema,
  hero: landingHeroSchema,
  marquee: landingMarqueeSchema,
  about: landingAboutSchema,
  portfolio: landingPortfolioSchema,
  contact: landingContactSchema,
  footer: landingFooterSchema,
} as const;

function deepMerge<T>(
  base: T,
  override: Record<string, unknown> | null | undefined,
): T {
  if (!override) return base;
  if (Array.isArray(base) || typeof base !== 'object' || base === null) {
    return override as T;
  }
  const result: Record<string, unknown> = {
    ...(base as Record<string, unknown>),
  };
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue;
    result[key] = deepMerge(result[key], value as Record<string, unknown>);
  }
  return result as T;
}

@Injectable()
export class LandingService {
  constructor(private readonly prisma: PrismaService) {}

  private async getStoredSection(
    section: LandingSection,
  ): Promise<Record<string, unknown> | null> {
    const row = await this.prisma.landingContent.findUnique({
      where: { section },
    });
    if (!row) return null;
    return row.content as Record<string, unknown>;
  }

  /** Full merged content (defaults + admin overrides). */
  async getPublicContent(): Promise<LandingContent> {
    const sections = await Promise.all(
      LANDING_SECTIONS.map(async (section) => {
        const stored = await this.getStoredSection(section);
        return [
          section,
          deepMerge(DEFAULT_LANDING_CONTENT[section], stored),
        ] as const;
      }),
    );
    return Object.fromEntries(sections) as LandingContent;
  }

  /** Admin view: merged content + edit metadata. */
  async getAdminContent() {
    const content = await this.getPublicContent();
    const rows = await this.prisma.landingContent.findMany();
    const meta = Object.fromEntries(
      rows.map((r) => [r.section, { updatedAt: r.updatedAt.toISOString() }]),
    ) as Record<LandingSection, { updatedAt: string }>;
    return { content, meta };
  }

  /** Validate + persist a full section override. */
  async updateSection(section: LandingSection, body: Record<string, unknown>) {
    const schema = SECTION_SCHEMAS[section];
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Konten section tidak valid',
        issues: parsed.error.flatten(),
      });
    }

    await this.prisma.landingContent.upsert({
      where: { section },
      create: { section, content: parsed.data },
      update: { content: parsed.data },
    });

    return this.getSection(section);
  }

  /** Merged view of a single section. */
  async getSection(section: LandingSection) {
    const stored = await this.getStoredSection(section);
    return deepMerge(DEFAULT_LANDING_CONTENT[section], stored);
  }

  /** Remove overrides → section falls back to defaults. */
  async resetSection(section: LandingSection) {
    await this.prisma.landingContent.deleteMany({ where: { section } });
    return { section, reset: true };
  }
}
