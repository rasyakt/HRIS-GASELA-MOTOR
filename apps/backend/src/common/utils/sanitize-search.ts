/**
 * Sanitizes input search query strings to prevent SQL/Prisma search injection
 * and removes control characters.
 */
export function sanitizeSearchString(input?: string): string | undefined {
  if (!input) return undefined;
  const trimmed = input.trim();
  if (!trimmed) return undefined;
  // Strip control characters and backslashes, cap length at 100
  const sanitized = trimmed.replace(/[\x00-\x1F\x7F\\]/g, '').slice(0, 100);
  return sanitized.length > 0 ? sanitized : undefined;
}
