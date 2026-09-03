import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';
import type { HomepageSectionType, HomepageStatus, HomepageSectionMediaRole } from './homepage.types.ts';

const VALID_STATUSES: HomepageStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

const VALID_SECTION_TYPES: HomepageSectionType[] = [
  'HERO',
  'FEATURED_COLLECTIONS',
  'FEATURED_PRODUCTS',
  'FEATURED_ARTISTS',
  'CATEGORIES',
  'ANTIQUES',
  'SANSKRIT_EDIT',
  'EDITORIAL',
  'IMAGE_BANNER',
  'PROMOTIONAL_BANNER',
  'SPACER'
];

const VALID_MEDIA_ROLES: HomepageSectionMediaRole[] = ['PRIMARY', 'MOBILE', 'BACKGROUND', 'GALLERY'];

/**
 * XSS Sanitizer for rich text content
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') return html;

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

  return sanitized;
}

/**
 * Validates CTA URLs for security
 */
export function validateCtaUrl(url?: string): boolean {
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

export class HomepageValidator {
  static validateCreateHomepage(req: Request, res: Response, next: NextFunction) {
    const { name, slug, status, isDefault, seoTitle, seoKeywords } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return ApiResponse.badRequest(res, 'Homepage name is required and cannot be empty');
    }

    if (name.trim().length > 191) {
      return ApiResponse.badRequest(res, 'Homepage name cannot exceed 191 characters');
    }

    if (slug !== undefined) {
      if (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) {
        return ApiResponse.badRequest(res, 'Custom slug must contain only lowercase alphanumeric characters and single hyphens');
      }
    }

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return ApiResponse.badRequest(res, `Invalid homepage status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    if (isDefault !== undefined && typeof isDefault !== 'boolean') {
      return ApiResponse.badRequest(res, 'isDefault must be a boolean');
    }

    if (seoTitle && typeof seoTitle === 'string' && seoTitle.length > 150) {
      return ApiResponse.badRequest(res, 'SEO Title cannot exceed 150 characters');
    }

    if (seoKeywords && typeof seoKeywords === 'string' && seoKeywords.length > 255) {
      return ApiResponse.badRequest(res, 'SEO Keywords cannot exceed 255 characters');
    }

    next();
  }

  static validateUpdateHomepage(req: Request, res: Response, next: NextFunction) {
    const { name, slug, status, isDefault, seoTitle, seoKeywords } = req.body;

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return ApiResponse.badRequest(res, 'Homepage name cannot be empty');
      }
      if (name.trim().length > 191) {
        return ApiResponse.badRequest(res, 'Homepage name cannot exceed 191 characters');
      }
    }

    if (slug !== undefined) {
      if (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) {
        return ApiResponse.badRequest(res, 'Custom slug must contain only lowercase alphanumeric characters and single hyphens');
      }
    }

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return ApiResponse.badRequest(res, `Invalid homepage status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    if (isDefault !== undefined && typeof isDefault !== 'boolean') {
      return ApiResponse.badRequest(res, 'isDefault must be a boolean');
    }

    if (seoTitle && typeof seoTitle === 'string' && seoTitle.length > 150) {
      return ApiResponse.badRequest(res, 'SEO Title cannot exceed 150 characters');
    }

    if (seoKeywords && typeof seoKeywords === 'string' && seoKeywords.length > 255) {
      return ApiResponse.badRequest(res, 'SEO Keywords cannot exceed 255 characters');
    }

    next();
  }

  static validateStatusUpdate(req: Request, res: Response, next: NextFunction) {
    const { status } = req.body;
    if (!status || !VALID_STATUSES.includes(status)) {
      return ApiResponse.badRequest(res, `Valid status is required (${VALID_STATUSES.join(', ')})`);
    }
    next();
  }

  static validateCreateSection(req: Request, res: Response, next: NextFunction) {
    const { type, title, subtitle, eyebrow, content, config, displayOrder, isVisible } = req.body;

    if (!type || !VALID_SECTION_TYPES.includes(type)) {
      return ApiResponse.badRequest(res, `Invalid section type. Must be one of: ${VALID_SECTION_TYPES.join(', ')}`);
    }

    if (title !== undefined && typeof title === 'string' && title.length > 255) {
      return ApiResponse.badRequest(res, 'Title cannot exceed 255 characters');
    }
    if (subtitle !== undefined && typeof subtitle === 'string' && subtitle.length > 255) {
      return ApiResponse.badRequest(res, 'Subtitle cannot exceed 255 characters');
    }
    if (eyebrow !== undefined && typeof eyebrow === 'string' && eyebrow.length > 255) {
      return ApiResponse.badRequest(res, 'Eyebrow cannot exceed 255 characters');
    }

    if (displayOrder !== undefined && (!Number.isInteger(Number(displayOrder)) || Number(displayOrder) < 0)) {
      return ApiResponse.badRequest(res, 'displayOrder must be a non-negative integer');
    }

    if (isVisible !== undefined && typeof isVisible !== 'boolean') {
      return ApiResponse.badRequest(res, 'isVisible must be a boolean');
    }

    // Type-specific config validation
    if (config) {
      if (typeof config !== 'object') {
        return ApiResponse.badRequest(res, 'config must be a valid JSON object');
      }

      if (config.ctaUrl && !validateCtaUrl(config.ctaUrl)) {
        return ApiResponse.badRequest(res, 'Invalid CTA URL. Must be a safe relative path or HTTP(S) URL');
      }

      if (type === 'SPACER') {
        if (config.height !== undefined && (typeof config.height !== 'number' || config.height < 0)) {
          return ApiResponse.badRequest(res, 'Spacer height must be a non-negative number');
        }
        if (config.desktopHeight !== undefined && (typeof config.desktopHeight !== 'number' || config.desktopHeight < 0)) {
          return ApiResponse.badRequest(res, 'Spacer desktopHeight must be a non-negative number');
        }
        if (config.mobileHeight !== undefined && (typeof config.mobileHeight !== 'number' || config.mobileHeight < 0)) {
          return ApiResponse.badRequest(res, 'Spacer mobileHeight must be a non-negative number');
        }
      }

      if (type === 'ANTIQUES' || type === 'SANSKRIT_EDIT') {
        if (config.selectionMode !== undefined && !['MANUAL', 'AUTOMATIC'].includes(config.selectionMode)) {
          return ApiResponse.badRequest(res, 'selectionMode must be MANUAL or AUTOMATIC');
        }
      }
    }

    if (content && typeof content === 'string') {
      req.body.content = sanitizeHtml(content);
    }

    next();
  }

  static validateUpdateSection(req: Request, res: Response, next: NextFunction) {
    const { type, title, subtitle, eyebrow, content, config, displayOrder, isVisible } = req.body;

    if (type !== undefined && !VALID_SECTION_TYPES.includes(type)) {
      return ApiResponse.badRequest(res, `Invalid section type. Must be one of: ${VALID_SECTION_TYPES.join(', ')}`);
    }

    if (title !== undefined && typeof title === 'string' && title.length > 255) {
      return ApiResponse.badRequest(res, 'Title cannot exceed 255 characters');
    }
    if (subtitle !== undefined && typeof subtitle === 'string' && subtitle.length > 255) {
      return ApiResponse.badRequest(res, 'Subtitle cannot exceed 255 characters');
    }
    if (eyebrow !== undefined && typeof eyebrow === 'string' && eyebrow.length > 255) {
      return ApiResponse.badRequest(res, 'Eyebrow cannot exceed 255 characters');
    }

    if (displayOrder !== undefined && (!Number.isInteger(Number(displayOrder)) || Number(displayOrder) < 0)) {
      return ApiResponse.badRequest(res, 'displayOrder must be a non-negative integer');
    }

    if (isVisible !== undefined && typeof isVisible !== 'boolean') {
      return ApiResponse.badRequest(res, 'isVisible must be a boolean');
    }

    if (config) {
      if (typeof config !== 'object') {
        return ApiResponse.badRequest(res, 'config must be a valid JSON object');
      }

      if (config.ctaUrl && !validateCtaUrl(config.ctaUrl)) {
        return ApiResponse.badRequest(res, 'Invalid CTA URL. Must be a safe relative path or HTTP(S) URL');
      }

      if (type === 'SPACER' || (!type && config.height !== undefined)) {
        if (config.height !== undefined && (typeof config.height !== 'number' || config.height < 0)) {
          return ApiResponse.badRequest(res, 'Spacer height must be a non-negative number');
        }
        if (config.desktopHeight !== undefined && (typeof config.desktopHeight !== 'number' || config.desktopHeight < 0)) {
          return ApiResponse.badRequest(res, 'Spacer desktopHeight must be a non-negative number');
        }
        if (config.mobileHeight !== undefined && (typeof config.mobileHeight !== 'number' || config.mobileHeight < 0)) {
          return ApiResponse.badRequest(res, 'Spacer mobileHeight must be a non-negative number');
        }
      }

      if (config.selectionMode !== undefined && !['MANUAL', 'AUTOMATIC'].includes(config.selectionMode)) {
        return ApiResponse.badRequest(res, 'selectionMode must be MANUAL or AUTOMATIC');
      }
    }

    if (content && typeof content === 'string') {
      req.body.content = sanitizeHtml(content);
    }

    next();
  }

  static validateReorderSections(req: Request, res: Response, next: NextFunction) {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return ApiResponse.badRequest(res, 'items must be a non-empty array of section reorder objects');
    }

    for (const item of items) {
      if (!item.id || typeof item.id !== 'string') {
        return ApiResponse.badRequest(res, 'Each reorder item must have a valid section id');
      }
      if (item.displayOrder === undefined || !Number.isInteger(Number(item.displayOrder)) || Number(item.displayOrder) < 0) {
        return ApiResponse.badRequest(res, 'Each reorder item must have a non-negative integer displayOrder');
      }
    }

    next();
  }

  static validateSectionItems(req: Request, res: Response, next: NextFunction) {
    const { items, ids } = req.body;
    const itemList = items || ids;

    if (!Array.isArray(itemList)) {
      return ApiResponse.badRequest(res, 'Payload must contain an array of items or ids');
    }

    for (const item of itemList) {
      const id = typeof item === 'string' ? item : item.id;
      if (!id || typeof id !== 'string' || id.trim().length === 0) {
        return ApiResponse.badRequest(res, 'Each item in the list must contain a valid ID');
      }
    }

    next();
  }

  static validateAttachMedia(req: Request, res: Response, next: NextFunction) {
    const { mediaId, role, displayOrder } = req.body;

    if (!mediaId || typeof mediaId !== 'string' || mediaId.trim().length === 0) {
      return ApiResponse.badRequest(res, 'mediaId is required');
    }

    if (role !== undefined && !VALID_MEDIA_ROLES.includes(role)) {
      return ApiResponse.badRequest(res, `role must be one of: ${VALID_MEDIA_ROLES.join(', ')}`);
    }

    if (displayOrder !== undefined && (!Number.isInteger(Number(displayOrder)) || Number(displayOrder) < 0)) {
      return ApiResponse.badRequest(res, 'displayOrder must be a non-negative integer');
    }

    next();
  }

  static validateReorderMedia(req: Request, res: Response, next: NextFunction) {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return ApiResponse.badRequest(res, 'items must be a non-empty array of media reorder objects');
    }

    for (const item of items) {
      if (!item.mediaId || typeof item.mediaId !== 'string') {
        return ApiResponse.badRequest(res, 'Each media item must have a valid mediaId');
      }
      if (item.role && !VALID_MEDIA_ROLES.includes(item.role)) {
        return ApiResponse.badRequest(res, `Invalid role "${item.role}"`);
      }
      if (item.displayOrder === undefined || !Number.isInteger(Number(item.displayOrder)) || Number(item.displayOrder) < 0) {
        return ApiResponse.badRequest(res, 'displayOrder must be a non-negative integer');
      }
    }

    next();
  }
}
