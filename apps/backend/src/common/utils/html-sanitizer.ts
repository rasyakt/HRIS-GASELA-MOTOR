import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Create a JSDOM window for DOMPurify to work in Node.js
const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

/**
 * Sanitizes HTML content to prevent XSS attacks
 * Allows only safe tags and attributes
 */
export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return '';

  return purify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'b',
      'i',
      'em',
      'strong',
      'p',
      'br',
      'ul',
      'ol',
      'li',
      'a',
      'span',
      'div',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):)/i,
  });
}

/**
 * Sanitizes HTML for rich text content
 * More permissive than sanitizeHtml but still safe
 */
export function sanitizeRichText(dirty: string | null | undefined): string {
  if (!dirty) return '';

  return purify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'p',
      'br',
      'hr',
      'b',
      'i',
      'u',
      'em',
      'strong',
      'ul',
      'ol',
      'li',
      'a',
      'blockquote',
      'code',
      'pre',
      'span',
      'div',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):)/i,
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Strips all HTML tags and returns plain text
 */
export function stripHtml(dirty: string | null | undefined): string {
  if (!dirty) return '';

  return purify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitizes SVG content
 * Very restrictive to prevent XSS
 */
export function sanitizeSvg(dirty: string | null | undefined): string {
  if (!dirty) return '';

  return purify.sanitize(dirty, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: ['use'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'foreignObject'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  });
}
