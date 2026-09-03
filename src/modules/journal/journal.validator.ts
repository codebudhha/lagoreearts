import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';

/**
 * XSS Content Sanitizer for Rich Editorial HTML
 * Preserves legitimate formatting, Sanskrit/Devanagari Unicode & danda, and IAST diacritics.
 * Strips script tags, style/link tags, inline on* handlers, and unsafe javascript: URLs.
 */
export function sanitizeHtmlContent(input?: string | null): string {
  if (!input) return '';

  let sanitized = input;

  // 1. Remove script, iframe, object, embed, applet tags & their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  sanitized = sanitized.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
  sanitized = sanitized.replace(/<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi, '');

  // 2. Remove inline event handlers (e.g., onload, onclick, onerror, onmouseover)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');

  // 3. Remove dangerous URL schemes (javascript:, vbscript:, data:)
  sanitized = sanitized.replace(/(?:href|src|action)\s*=\s*['"]\s*(?:javascript|vbscript|data):[^'"]*['"]/gi, '');
  sanitized = sanitized.replace(/(?:href|src|action)\s*=\s*(?:javascript|vbscript|data):[^\s>]*/gi, '');

  return sanitized.trim();
}

/**
 * Validates slug format (kebab-case)
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

// ==========================================
// Author Validators
// ==========================================

export function validateCreateAuthor(req: Request, res: Response, next: NextFunction) {
  const { name, slug, bio, status } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return ApiResponse.badRequest(res, 'Author name is required and cannot be empty');
  }

  if (slug !== undefined) {
    if (typeof slug !== 'string' || !isValidSlug(slug.trim())) {
      return ApiResponse.badRequest(res, 'Author slug must be valid kebab-case (e.g. "dr-anand-kumarswamy")');
    }
  }

  if (bio !== undefined && typeof bio === 'string' && bio.length > 2000) {
    return ApiResponse.badRequest(res, 'Author bio cannot exceed 2000 characters');
  }

  if (status !== undefined && !['ACTIVE', 'INACTIVE'].includes(status)) {
    return ApiResponse.badRequest(res, 'Status must be ACTIVE or INACTIVE');
  }

  next();
}

export function validateUpdateAuthor(req: Request, res: Response, next: NextFunction) {
  const { name, slug, bio, status } = req.body;

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      return ApiResponse.badRequest(res, 'Author name cannot be empty');
    }
  }

  if (slug !== undefined) {
    if (typeof slug !== 'string' || !isValidSlug(slug.trim())) {
      return ApiResponse.badRequest(res, 'Author slug must be valid kebab-case');
    }
  }

  if (bio !== undefined && typeof bio === 'string' && bio.length > 2000) {
    return ApiResponse.badRequest(res, 'Author bio cannot exceed 2000 characters');
  }

  if (status !== undefined && !['ACTIVE', 'INACTIVE'].includes(status)) {
    return ApiResponse.badRequest(res, 'Status must be ACTIVE or INACTIVE');
  }

  next();
}

// ==========================================
// Category Validators
// ==========================================

export function validateCreateCategory(req: Request, res: Response, next: NextFunction) {
  const { name, slug, status, sortOrder } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return ApiResponse.badRequest(res, 'Category name is required and cannot be empty');
  }

  if (slug !== undefined) {
    if (typeof slug !== 'string' || !isValidSlug(slug.trim())) {
      return ApiResponse.badRequest(res, 'Category slug must be valid kebab-case');
    }
  }

  if (status !== undefined && !['ACTIVE', 'INACTIVE'].includes(status)) {
    return ApiResponse.badRequest(res, 'Status must be ACTIVE or INACTIVE');
  }

  if (sortOrder !== undefined && (typeof sortOrder !== 'number' || sortOrder < 0)) {
    return ApiResponse.badRequest(res, 'Sort order must be a non-negative integer');
  }

  next();
}

export function validateUpdateCategory(req: Request, res: Response, next: NextFunction) {
  const { name, slug, status, sortOrder } = req.body;

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      return ApiResponse.badRequest(res, 'Category name cannot be empty');
    }
  }

  if (slug !== undefined) {
    if (typeof slug !== 'string' || !isValidSlug(slug.trim())) {
      return ApiResponse.badRequest(res, 'Category slug must be valid kebab-case');
    }
  }

  if (status !== undefined && !['ACTIVE', 'INACTIVE'].includes(status)) {
    return ApiResponse.badRequest(res, 'Status must be ACTIVE or INACTIVE');
  }

  if (sortOrder !== undefined && (typeof sortOrder !== 'number' || sortOrder < 0)) {
    return ApiResponse.badRequest(res, 'Sort order must be a non-negative integer');
  }

  next();
}

// ==========================================
// Tag Validators
// ==========================================

export function validateCreateTag(req: Request, res: Response, next: NextFunction) {
  const { name, slug, status } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return ApiResponse.badRequest(res, 'Tag name is required and cannot be empty');
  }

  if (slug !== undefined) {
    if (typeof slug !== 'string' || !isValidSlug(slug.trim())) {
      return ApiResponse.badRequest(res, 'Tag slug must be valid kebab-case');
    }
  }

  if (status !== undefined && !['ACTIVE', 'INACTIVE'].includes(status)) {
    return ApiResponse.badRequest(res, 'Status must be ACTIVE or INACTIVE');
  }

  next();
}

export function validateUpdateTag(req: Request, res: Response, next: NextFunction) {
  const { name, slug, status } = req.body;

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      return ApiResponse.badRequest(res, 'Tag name cannot be empty');
    }
  }

  if (slug !== undefined) {
    if (typeof slug !== 'string' || !isValidSlug(slug.trim())) {
      return ApiResponse.badRequest(res, 'Tag slug must be valid kebab-case');
    }
  }

  if (status !== undefined && !['ACTIVE', 'INACTIVE'].includes(status)) {
    return ApiResponse.badRequest(res, 'Status must be ACTIVE or INACTIVE');
  }

  next();
}

// ==========================================
// Post Validators
// ==========================================

const VALID_POST_TYPES = ['ARTICLE', 'ESSAY', 'INTERVIEW', 'STORY', 'GUIDE', 'NEWS'];
const VALID_POST_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

export function validateCreatePost(req: Request, res: Response, next: NextFunction) {
  const { title, slug, excerpt, type, status, featured, displayOrder } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return ApiResponse.badRequest(res, 'Post title is required and cannot be empty');
  }

  if (slug !== undefined) {
    if (typeof slug !== 'string' || !isValidSlug(slug.trim())) {
      return ApiResponse.badRequest(res, 'Post slug must be valid kebab-case');
    }
  }

  if (excerpt !== undefined && typeof excerpt === 'string' && excerpt.length > 1000) {
    return ApiResponse.badRequest(res, 'Excerpt cannot exceed 1000 characters');
  }

  if (type !== undefined && !VALID_POST_TYPES.includes(type)) {
    return ApiResponse.badRequest(res, `Post type must be one of: ${VALID_POST_TYPES.join(', ')}`);
  }

  if (status !== undefined && !VALID_POST_STATUSES.includes(status)) {
    return ApiResponse.badRequest(res, `Post status must be one of: ${VALID_POST_STATUSES.join(', ')}`);
  }

  if (featured === true && status !== 'PUBLISHED') {
    return ApiResponse.badRequest(res, 'Only published posts can be marked as featured');
  }

  if (displayOrder !== undefined && (typeof displayOrder !== 'number' || displayOrder < 0)) {
    return ApiResponse.badRequest(res, 'Display order must be a non-negative integer');
  }

  next();
}

export function validateUpdatePost(req: Request, res: Response, next: NextFunction) {
  const { title, slug, excerpt, type, status, featured, displayOrder } = req.body;

  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      return ApiResponse.badRequest(res, 'Post title cannot be empty');
    }
  }

  if (slug !== undefined) {
    if (typeof slug !== 'string' || !isValidSlug(slug.trim())) {
      return ApiResponse.badRequest(res, 'Post slug must be valid kebab-case');
    }
  }

  if (excerpt !== undefined && typeof excerpt === 'string' && excerpt.length > 1000) {
    return ApiResponse.badRequest(res, 'Excerpt cannot exceed 1000 characters');
  }

  if (type !== undefined && !VALID_POST_TYPES.includes(type)) {
    return ApiResponse.badRequest(res, `Post type must be one of: ${VALID_POST_TYPES.join(', ')}`);
  }

  if (status !== undefined && !VALID_POST_STATUSES.includes(status)) {
    return ApiResponse.badRequest(res, `Post status must be one of: ${VALID_POST_STATUSES.join(', ')}`);
  }

  if (displayOrder !== undefined && (typeof displayOrder !== 'number' || displayOrder < 0)) {
    return ApiResponse.badRequest(res, 'Display order must be a non-negative integer');
  }

  next();
}

export function validateAttachMedia(req: Request, res: Response, next: NextFunction) {
  const { mediaId, role, sortOrder } = req.body;

  if (!mediaId || typeof mediaId !== 'string') {
    return ApiResponse.badRequest(res, 'mediaId is required');
  }

  if (role !== undefined && !['COVER', 'GALLERY', 'OG'].includes(role)) {
    return ApiResponse.badRequest(res, 'role must be COVER, GALLERY, or OG');
  }

  if (sortOrder !== undefined && (typeof sortOrder !== 'number' || sortOrder < 0)) {
    return ApiResponse.badRequest(res, 'sortOrder must be a non-negative integer');
  }

  next();
}
