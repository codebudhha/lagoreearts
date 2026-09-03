import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';
import type { LookbookSectionType, LookbookStatus, LookbookSectionMediaRole } from './lookbook.types.ts';

const VALID_STATUSES: LookbookStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

const VALID_SECTION_TYPES: LookbookSectionType[] = [
  'HERO',
  'EDITORIAL',
  'PRODUCTS',
  'COLLECTIONS',
  'ARTISTS',
  'CATEGORIES',
  'JOURNAL',
  'SANSKRIT_EDIT',
  'GALLERY',
  'MIXED'
];

const VALID_MEDIA_ROLES: LookbookSectionMediaRole[] = ['PRIMARY', 'BACKGROUND', 'GALLERY', 'MOBILE', 'DESKTOP', 'OG'];

/**
 * XSS Sanitizer for rich text content while preserving Unicode & semantic HTML
 */
export function sanitizeHtml(html?: string | null): string | null {
  if (!html || typeof html !== 'string') return html as any;

  let sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/\s*on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/href\s*=\s*(['"]?)\s*javascript:[^'"]*\1/gi, 'href="#"')
    .replace(/src\s*=\s*(['"]?)\s*javascript:[^'"]*\1/gi, 'src=""')
    .replace(/href\s*=\s*(['"]?)\s*data:text\/html[^'"]*\1/gi, 'href="#"')
    .replace(/href\s*=\s*(['"]?)\s*vbscript:[^'"]*\1/gi, 'href="#"');

  return sanitized.trim();
}

/**
 * Validates CTA URLs for security
 */
export function validateCtaUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim();
  if (!trimmed) return true;

  // Disallow javascript:, data:, vbscript: protocols
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return false;
  }

  // Allow relative paths starting with /
  if (trimmed.startsWith('/')) {
    return true;
  }

  // Allow https or http URLs
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export class LookbookValidator {
  static validateCreateLookbook(req: Request, res: Response, next: NextFunction) {
    const { title, slug, shortDescription, description, status, featured, displayOrder, seoTitle, seoDescription, seoKeywords } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return ApiResponse.badRequest(res, 'Lookbook title is required and cannot be empty');
    }

    if (title.trim().length > 255) {
      return ApiResponse.badRequest(res, 'Lookbook title cannot exceed 255 characters');
    }

    if (slug !== undefined) {
      if (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) {
        return ApiResponse.badRequest(res, 'Custom slug must contain only lowercase alphanumeric characters and single hyphens');
      }
    }

    if (shortDescription && typeof shortDescription === 'string' && shortDescription.length > 500) {
      return ApiResponse.badRequest(res, 'Short description cannot exceed 500 characters');
    }

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return ApiResponse.badRequest(res, `Invalid lookbook status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    if (featured !== undefined && typeof featured !== 'boolean') {
      return ApiResponse.badRequest(res, 'featured must be a boolean');
    }

    if (displayOrder !== undefined && (typeof displayOrder !== 'number' || displayOrder < 0 || !Number.isInteger(displayOrder))) {
      return ApiResponse.badRequest(res, 'displayOrder must be a non-negative integer');
    }

    if (seoTitle && typeof seoTitle === 'string' && seoTitle.length > 255) {
      return ApiResponse.badRequest(res, 'SEO Title cannot exceed 255 characters');
    }

    if (seoKeywords && typeof seoKeywords === 'string' && seoKeywords.length > 255) {
      return ApiResponse.badRequest(res, 'SEO Keywords cannot exceed 255 characters');
    }

    if (req.body.description) {
      req.body.description = sanitizeHtml(req.body.description);
    }
    if (req.body.shortDescription) {
      req.body.shortDescription = sanitizeHtml(req.body.shortDescription);
    }

    next();
  }

  static validateUpdateLookbook(req: Request, res: Response, next: NextFunction) {
    const { title, slug, shortDescription, description, status, featured, displayOrder, seoTitle, seoDescription, seoKeywords } = req.body;

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return ApiResponse.badRequest(res, 'Lookbook title cannot be empty');
      }
      if (title.trim().length > 255) {
        return ApiResponse.badRequest(res, 'Lookbook title cannot exceed 255 characters');
      }
    }

    if (slug !== undefined) {
      if (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) {
        return ApiResponse.badRequest(res, 'Custom slug must contain only lowercase alphanumeric characters and single hyphens');
      }
    }

    if (shortDescription !== undefined && shortDescription !== null) {
      if (typeof shortDescription !== 'string' || shortDescription.length > 500) {
        return ApiResponse.badRequest(res, 'Short description cannot exceed 500 characters');
      }
    }

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return ApiResponse.badRequest(res, `Invalid lookbook status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    if (featured !== undefined && typeof featured !== 'boolean') {
      return ApiResponse.badRequest(res, 'featured must be a boolean');
    }

    if (displayOrder !== undefined && (typeof displayOrder !== 'number' || displayOrder < 0 || !Number.isInteger(displayOrder))) {
      return ApiResponse.badRequest(res, 'displayOrder must be a non-negative integer');
    }

    if (seoTitle && typeof seoTitle === 'string' && seoTitle.length > 255) {
      return ApiResponse.badRequest(res, 'SEO Title cannot exceed 255 characters');
    }

    if (seoKeywords && typeof seoKeywords === 'string' && seoKeywords.length > 255) {
      return ApiResponse.badRequest(res, 'SEO Keywords cannot exceed 255 characters');
    }

    if (description) {
      req.body.description = sanitizeHtml(description);
    }
    if (shortDescription) {
      req.body.shortDescription = sanitizeHtml(shortDescription);
    }

    next();
  }

  static validateCreateSection(req: Request, res: Response, next: NextFunction) {
    const { type, title, subtitle, body, ctaLabel, ctaUrl, displayOrder, isVisible, layout, config } = req.body;

    if (!type || !VALID_SECTION_TYPES.includes(type)) {
      return ApiResponse.badRequest(res, `Section type is required and must be one of: ${VALID_SECTION_TYPES.join(', ')}`);
    }

    if (title && typeof title === 'string' && title.length > 255) {
      return ApiResponse.badRequest(res, 'Section title cannot exceed 255 characters');
    }

    if (subtitle && typeof subtitle === 'string' && subtitle.length > 255) {
      return ApiResponse.badRequest(res, 'Section subtitle cannot exceed 255 characters');
    }

    if (ctaLabel && typeof ctaLabel === 'string' && ctaLabel.length > 100) {
      return ApiResponse.badRequest(res, 'CTA Label cannot exceed 100 characters');
    }

    if (ctaUrl && !validateCtaUrl(ctaUrl)) {
      return ApiResponse.badRequest(res, 'CTA URL must be a valid relative path (/...) or absolute http(s) URL');
    }

    if (displayOrder !== undefined && (typeof displayOrder !== 'number' || displayOrder < 0 || !Number.isInteger(displayOrder))) {
      return ApiResponse.badRequest(res, 'displayOrder must be a non-negative integer');
    }

    if (isVisible !== undefined && typeof isVisible !== 'boolean') {
      return ApiResponse.badRequest(res, 'isVisible must be a boolean');
    }

    if (body) {
      req.body.body = sanitizeHtml(body);
    }

    if (config?.ctaUrl && !validateCtaUrl(config.ctaUrl)) {
      return ApiResponse.badRequest(res, 'Configuration CTA URL must be a valid relative path (/...) or absolute http(s) URL');
    }

    next();
  }

  static validateUpdateSection(req: Request, res: Response, next: NextFunction) {
    const { type, title, subtitle, body, ctaLabel, ctaUrl, displayOrder, isVisible, layout, config } = req.body;

    if (type !== undefined && !VALID_SECTION_TYPES.includes(type)) {
      return ApiResponse.badRequest(res, `Invalid section type. Must be one of: ${VALID_SECTION_TYPES.join(', ')}`);
    }

    if (title && typeof title === 'string' && title.length > 255) {
      return ApiResponse.badRequest(res, 'Section title cannot exceed 255 characters');
    }

    if (subtitle && typeof subtitle === 'string' && subtitle.length > 255) {
      return ApiResponse.badRequest(res, 'Section subtitle cannot exceed 255 characters');
    }

    if (ctaLabel && typeof ctaLabel === 'string' && ctaLabel.length > 100) {
      return ApiResponse.badRequest(res, 'CTA Label cannot exceed 100 characters');
    }

    if (ctaUrl && !validateCtaUrl(ctaUrl)) {
      return ApiResponse.badRequest(res, 'CTA URL must be a valid relative path (/...) or absolute http(s) URL');
    }

    if (displayOrder !== undefined && (typeof displayOrder !== 'number' || displayOrder < 0 || !Number.isInteger(displayOrder))) {
      return ApiResponse.badRequest(res, 'displayOrder must be a non-negative integer');
    }

    if (isVisible !== undefined && typeof isVisible !== 'boolean') {
      return ApiResponse.badRequest(res, 'isVisible must be a boolean');
    }

    if (body) {
      req.body.body = sanitizeHtml(body);
    }

    if (config?.ctaUrl && !validateCtaUrl(config.ctaUrl)) {
      return ApiResponse.badRequest(res, 'Configuration CTA URL must be a valid relative path (/...) or absolute http(s) URL');
    }

    next();
  }

  static validateReorderSections(req: Request, res: Response, next: NextFunction) {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return ApiResponse.badRequest(res, 'Reorder items array is required and cannot be empty');
    }

    for (const item of items) {
      if (!item.id || typeof item.id !== 'string') {
        return ApiResponse.badRequest(res, 'Each item must have a valid section id string');
      }
      if (typeof item.displayOrder !== 'number' || item.displayOrder < 0 || !Number.isInteger(item.displayOrder)) {
        return ApiResponse.badRequest(res, 'Each item must have a non-negative integer displayOrder');
      }
    }

    next();
  }

  static validateAttachMedia(req: Request, res: Response, next: NextFunction) {
    const { mediaId, role, sortOrder, isPrimary } = req.body;

    if (!mediaId || typeof mediaId !== 'string') {
      return ApiResponse.badRequest(res, 'mediaId string is required');
    }

    if (role !== undefined && !VALID_MEDIA_ROLES.includes(role)) {
      return ApiResponse.badRequest(res, `Invalid media role. Must be one of: ${VALID_MEDIA_ROLES.join(', ')}`);
    }

    if (sortOrder !== undefined && (typeof sortOrder !== 'number' || sortOrder < 0 || !Number.isInteger(sortOrder))) {
      return ApiResponse.badRequest(res, 'sortOrder must be a non-negative integer');
    }

    if (isPrimary !== undefined && typeof isPrimary !== 'boolean') {
      return ApiResponse.badRequest(res, 'isPrimary must be a boolean');
    }

    next();
  }

  static validateReorderMedia(req: Request, res: Response, next: NextFunction) {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return ApiResponse.badRequest(res, 'Reorder media items array is required and cannot be empty');
    }

    for (const item of items) {
      if (!item.mediaId || typeof item.mediaId !== 'string') {
        return ApiResponse.badRequest(res, 'Each item must have a valid mediaId');
      }
      if (!item.role || !VALID_MEDIA_ROLES.includes(item.role)) {
        return ApiResponse.badRequest(res, `Each item must have a valid role: ${VALID_MEDIA_ROLES.join(', ')}`);
      }
      if (typeof item.sortOrder !== 'number' || item.sortOrder < 0 || !Number.isInteger(item.sortOrder)) {
        return ApiResponse.badRequest(res, 'Each item must have a non-negative integer sortOrder');
      }
    }

    next();
  }

  static validateSetProducts(req: Request, res: Response, next: NextFunction) {
    const { products } = req.body;

    if (!Array.isArray(products)) {
      return ApiResponse.badRequest(res, 'products array is required');
    }

    const seen = new Set<string>();
    for (const p of products) {
      if (!p.id || typeof p.id !== 'string') {
        return ApiResponse.badRequest(res, 'Each product item must have a valid product id string');
      }
      if (seen.has(p.id)) {
        return ApiResponse.error(res, 'DUPLICATE_SECTION_ITEM', `Duplicate product ID "${p.id}" in section item list`, 400);
      }
      seen.add(p.id);
    }

    next();
  }

  static validateSetCollections(req: Request, res: Response, next: NextFunction) {
    const { collections } = req.body;

    if (!Array.isArray(collections)) {
      return ApiResponse.badRequest(res, 'collections array is required');
    }

    const seen = new Set<string>();
    for (const c of collections) {
      if (!c.id || typeof c.id !== 'string') {
        return ApiResponse.badRequest(res, 'Each collection item must have a valid collection id string');
      }
      if (seen.has(c.id)) {
        return ApiResponse.error(res, 'DUPLICATE_SECTION_ITEM', `Duplicate collection ID "${c.id}" in section item list`, 400);
      }
      seen.add(c.id);
    }

    next();
  }

  static validateSetArtists(req: Request, res: Response, next: NextFunction) {
    const { artists } = req.body;

    if (!Array.isArray(artists)) {
      return ApiResponse.badRequest(res, 'artists array is required');
    }

    const seen = new Set<string>();
    for (const a of artists) {
      if (!a.id || typeof a.id !== 'string') {
        return ApiResponse.badRequest(res, 'Each artist item must have a valid artist id string');
      }
      if (seen.has(a.id)) {
        return ApiResponse.error(res, 'DUPLICATE_SECTION_ITEM', `Duplicate artist ID "${a.id}" in section item list`, 400);
      }
      seen.add(a.id);
    }

    next();
  }

  static validateSetCategories(req: Request, res: Response, next: NextFunction) {
    const { categories } = req.body;

    if (!Array.isArray(categories)) {
      return ApiResponse.badRequest(res, 'categories array is required');
    }

    const seen = new Set<string>();
    for (const cat of categories) {
      if (!cat.id || typeof cat.id !== 'string') {
        return ApiResponse.badRequest(res, 'Each category item must have a valid category id string');
      }
      if (seen.has(cat.id)) {
        return ApiResponse.error(res, 'DUPLICATE_SECTION_ITEM', `Duplicate category ID "${cat.id}" in section item list`, 400);
      }
      seen.add(cat.id);
    }

    next();
  }

  static validateSetJournals(req: Request, res: Response, next: NextFunction) {
    const { journals } = req.body;

    if (!Array.isArray(journals)) {
      return ApiResponse.badRequest(res, 'journals array is required');
    }

    const seen = new Set<string>();
    for (const j of journals) {
      if (!j.id || typeof j.id !== 'string') {
        return ApiResponse.badRequest(res, 'Each journal item must have a valid journalPost id string');
      }
      if (seen.has(j.id)) {
        return ApiResponse.error(res, 'DUPLICATE_SECTION_ITEM', `Duplicate journal post ID "${j.id}" in section item list`, 400);
      }
      seen.add(j.id);
    }

    next();
  }

  static validateSetSanskritEdits(req: Request, res: Response, next: NextFunction) {
    const { sanskritEdits } = req.body;

    if (!Array.isArray(sanskritEdits)) {
      return ApiResponse.badRequest(res, 'sanskritEdits array is required');
    }

    const seen = new Set<string>();
    for (const s of sanskritEdits) {
      if (!s.id || typeof s.id !== 'string') {
        return ApiResponse.badRequest(res, 'Each sanskrit edit item must have a valid sanskritEditProfile id string');
      }
      if (seen.has(s.id)) {
        return ApiResponse.error(res, 'DUPLICATE_SECTION_ITEM', `Duplicate sanskrit edit profile ID "${s.id}" in section item list`, 400);
      }
      seen.add(s.id);
    }

    next();
  }
}
