import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';
import type { NavigationLocation, NavigationStatus, NavigationItemTargetType, NavigationItemDisplayType } from './navigation.types.ts';

const VALID_LOCATIONS: NavigationLocation[] = ['HEADER', 'FOOTER', 'MOBILE', 'SECONDARY'];
const VALID_STATUSES: NavigationStatus[] = ['ACTIVE', 'INACTIVE'];
const VALID_TARGET_TYPES: NavigationItemTargetType[] = [
  'NONE',
  'CATEGORY',
  'COLLECTION',
  'PRODUCT',
  'ARTIST',
  'JOURNAL',
  'LOOKBOOK',
  'SANSKRIT_EDIT',
  'INTERNAL_URL',
  'EXTERNAL_URL'
];
const VALID_DISPLAY_TYPES: NavigationItemDisplayType[] = ['LINK', 'GROUP', 'MEGA_MENU'];

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Sanitize plain text string by stripping dangerous HTML tags, script tags, event handlers
 * while preserving Unicode (Devanagari, Sanskrit, IAST, accents).
 */
export function sanitizeText(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, '') // Strip all HTML tags for plain text labels
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

/**
 * Validate internal relative URL path.
 * Must start with '/', no scheme, no protocol-relative '//', no scripts.
 */
export function validateInternalUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith('/')) return false;
  if (trimmed.startsWith('//')) return false; // Reject protocol-relative URLs

  const lower = trimmed.toLowerCase();
  if (
    lower.includes('javascript:') ||
    lower.includes('data:') ||
    lower.includes('vbscript:') ||
    lower.includes('<') ||
    lower.includes('>') ||
    lower.includes('\0') ||
    lower.includes('\r') ||
    lower.includes('\n')
  ) {
    return false;
  }

  return true;
}

/**
 * Validate external absolute URL.
 * Must start with http:// or https://.
 */
export function validateExternalUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();

  if (!lower.startsWith('http://') && !lower.startsWith('https://')) {
    return false;
  }

  if (
    lower.includes('javascript:') ||
    lower.includes('data:') ||
    lower.includes('vbscript:') ||
    lower.includes('file:') ||
    lower.includes('about:') ||
    lower.includes('chrome:') ||
    lower.includes('<') ||
    lower.includes('>') ||
    lower.includes('\0')
  ) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export class NavigationValidator {
  static validateCreateNavigation(req: Request, res: Response, next: NextFunction) {
    const { name, slug, location, status, isDefault } = req.body;

    if (!name || typeof name !== 'string' || sanitizeText(name).length === 0) {
      return ApiResponse.badRequest(res, 'Navigation name is required and cannot be empty');
    }

    if (name.length > 255) {
      return ApiResponse.badRequest(res, 'Navigation name cannot exceed 255 characters');
    }

    if (slug !== undefined) {
      if (typeof slug !== 'string' || !SLUG_REGEX.test(slug.trim().toLowerCase())) {
        return ApiResponse.badRequest(res, 'Custom slug must contain only lowercase letters, numbers, and hyphens');
      }
    }

    if (location !== undefined && !VALID_LOCATIONS.includes(location)) {
      return ApiResponse.badRequest(res, `Invalid location. Allowed: ${VALID_LOCATIONS.join(', ')}`);
    }

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return ApiResponse.badRequest(res, `Invalid status. Allowed: ${VALID_STATUSES.join(', ')}`);
    }

    if (isDefault !== undefined && typeof isDefault !== 'boolean') {
      return ApiResponse.badRequest(res, 'isDefault must be a boolean');
    }

    next();
  }

  static validateUpdateNavigation(req: Request, res: Response, next: NextFunction) {
    const { name, slug, location, status, isDefault } = req.body;

    if (name !== undefined) {
      if (typeof name !== 'string' || sanitizeText(name).length === 0) {
        return ApiResponse.badRequest(res, 'Navigation name cannot be empty');
      }
      if (name.length > 255) {
        return ApiResponse.badRequest(res, 'Navigation name cannot exceed 255 characters');
      }
    }

    if (slug !== undefined) {
      if (typeof slug !== 'string' || !SLUG_REGEX.test(slug.trim().toLowerCase())) {
        return ApiResponse.badRequest(res, 'Custom slug must contain only lowercase letters, numbers, and hyphens');
      }
    }

    if (location !== undefined && !VALID_LOCATIONS.includes(location)) {
      return ApiResponse.badRequest(res, `Invalid location. Allowed: ${VALID_LOCATIONS.join(', ')}`);
    }

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return ApiResponse.badRequest(res, `Invalid status. Allowed: ${VALID_STATUSES.join(', ')}`);
    }

    if (isDefault !== undefined && typeof isDefault !== 'boolean') {
      return ApiResponse.badRequest(res, 'isDefault must be a boolean');
    }

    next();
  }

  static validateCreateNavigationItem(req: Request, res: Response, next: NextFunction) {
    const { label, description, targetType, targetId, url, displayType, openInNewTab, isVisible, isFeatured, sortOrder, parentId } = req.body;

    if (!label || typeof label !== 'string' || sanitizeText(label).length === 0) {
      return ApiResponse.badRequest(res, 'Navigation item label is required and cannot be empty');
    }

    if (label.length > 255) {
      return ApiResponse.badRequest(res, 'Navigation item label cannot exceed 255 characters');
    }

    if (description !== undefined && description !== null && typeof description !== 'string') {
      return ApiResponse.badRequest(res, 'description must be a string if provided');
    }

    const effectiveTargetType: NavigationItemTargetType = targetType || 'NONE';
    if (!VALID_TARGET_TYPES.includes(effectiveTargetType)) {
      return ApiResponse.badRequest(res, `Invalid targetType. Allowed: ${VALID_TARGET_TYPES.join(', ')}`);
    }

    if (displayType !== undefined && !VALID_DISPLAY_TYPES.includes(displayType)) {
      return ApiResponse.badRequest(res, `Invalid displayType. Allowed: ${VALID_DISPLAY_TYPES.join(', ')}`);
    }

    // Target validation rules
    const entityTargets: NavigationItemTargetType[] = ['CATEGORY', 'COLLECTION', 'PRODUCT', 'ARTIST', 'JOURNAL', 'LOOKBOOK', 'SANSKRIT_EDIT'];
    if (entityTargets.includes(effectiveTargetType)) {
      if (!targetId || typeof targetId !== 'string' || targetId.trim().length === 0) {
        return ApiResponse.badRequest(res, `targetId is required when targetType is ${effectiveTargetType}`);
      }
    }

    if (effectiveTargetType === 'INTERNAL_URL') {
      if (!url || !validateInternalUrl(url)) {
        return ApiResponse.badRequest(res, 'A valid internal path starting with / is required for INTERNAL_URL targetType');
      }
    }

    if (effectiveTargetType === 'EXTERNAL_URL') {
      if (!url || !validateExternalUrl(url)) {
        return ApiResponse.badRequest(res, 'A valid external URL starting with http:// or https:// is required for EXTERNAL_URL targetType');
      }
    }

    if (sortOrder !== undefined && (typeof sortOrder !== 'number' || sortOrder < 0 || !Number.isInteger(sortOrder))) {
      return ApiResponse.badRequest(res, 'sortOrder must be a non-negative integer');
    }

    if (openInNewTab !== undefined && typeof openInNewTab !== 'boolean') {
      return ApiResponse.badRequest(res, 'openInNewTab must be a boolean');
    }

    if (isVisible !== undefined && typeof isVisible !== 'boolean') {
      return ApiResponse.badRequest(res, 'isVisible must be a boolean');
    }

    if (isFeatured !== undefined && typeof isFeatured !== 'boolean') {
      return ApiResponse.badRequest(res, 'isFeatured must be a boolean');
    }

    if (parentId !== undefined && parentId !== null && typeof parentId !== 'string') {
      return ApiResponse.badRequest(res, 'parentId must be a valid UUID string or null');
    }

    next();
  }

  static validateUpdateNavigationItem(req: Request, res: Response, next: NextFunction) {
    const { label, description, targetType, targetId, url, displayType, openInNewTab, isVisible, isFeatured, sortOrder, parentId } = req.body;

    if (label !== undefined) {
      if (typeof label !== 'string' || sanitizeText(label).length === 0) {
        return ApiResponse.badRequest(res, 'Navigation item label cannot be empty');
      }
      if (label.length > 255) {
        return ApiResponse.badRequest(res, 'Navigation item label cannot exceed 255 characters');
      }
    }

    if (description !== undefined && description !== null && typeof description !== 'string') {
      return ApiResponse.badRequest(res, 'description must be a string if provided');
    }

    if (targetType !== undefined && !VALID_TARGET_TYPES.includes(targetType)) {
      return ApiResponse.badRequest(res, `Invalid targetType. Allowed: ${VALID_TARGET_TYPES.join(', ')}`);
    }

    if (displayType !== undefined && !VALID_DISPLAY_TYPES.includes(displayType)) {
      return ApiResponse.badRequest(res, `Invalid displayType. Allowed: ${VALID_DISPLAY_TYPES.join(', ')}`);
    }

    const entityTargets: NavigationItemTargetType[] = ['CATEGORY', 'COLLECTION', 'PRODUCT', 'ARTIST', 'JOURNAL', 'LOOKBOOK', 'SANSKRIT_EDIT'];
    if (targetType && entityTargets.includes(targetType)) {
      if (!targetId || typeof targetId !== 'string' || targetId.trim().length === 0) {
        return ApiResponse.badRequest(res, `targetId is required when targetType is ${targetType}`);
      }
    }

    if (targetType === 'INTERNAL_URL' || (url && !targetType)) {
      if (url !== undefined && !validateInternalUrl(url)) {
        return ApiResponse.badRequest(res, 'A valid internal path starting with / is required for INTERNAL_URL targetType');
      }
    }

    if (targetType === 'EXTERNAL_URL' || (url && !targetType)) {
      if (url !== undefined && !validateExternalUrl(url) && !validateInternalUrl(url)) {
        return ApiResponse.badRequest(res, 'A valid URL starting with http:// or https:// is required for EXTERNAL_URL targetType');
      }
    }

    if (sortOrder !== undefined && (typeof sortOrder !== 'number' || sortOrder < 0 || !Number.isInteger(sortOrder))) {
      return ApiResponse.badRequest(res, 'sortOrder must be a non-negative integer');
    }

    if (openInNewTab !== undefined && typeof openInNewTab !== 'boolean') {
      return ApiResponse.badRequest(res, 'openInNewTab must be a boolean');
    }

    if (isVisible !== undefined && typeof isVisible !== 'boolean') {
      return ApiResponse.badRequest(res, 'isVisible must be a boolean');
    }

    if (isFeatured !== undefined && typeof isFeatured !== 'boolean') {
      return ApiResponse.badRequest(res, 'isFeatured must be a boolean');
    }

    if (parentId !== undefined && parentId !== null && typeof parentId !== 'string') {
      return ApiResponse.badRequest(res, 'parentId must be a valid UUID string or null');
    }

    next();
  }

  static validateReorderItems(req: Request, res: Response, next: NextFunction) {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return ApiResponse.badRequest(res, 'Reorder items array is required and cannot be empty');
    }

    const seenIds = new Set<string>();
    for (const item of items) {
      if (!item.id || typeof item.id !== 'string') {
        return ApiResponse.badRequest(res, 'Each item must contain a valid id string');
      }
      if (seenIds.has(item.id)) {
        return ApiResponse.error(res, 'DUPLICATE_NAVIGATION_ITEM', `Duplicate navigation item ID "${item.id}" in reorder payload`, 400);
      }
      seenIds.add(item.id);

      if (item.sortOrder === undefined || typeof item.sortOrder !== 'number' || item.sortOrder < 0 || !Number.isInteger(item.sortOrder)) {
        return ApiResponse.badRequest(res, 'Each item must contain a non-negative integer sortOrder');
      }

      if (item.parentId !== undefined && item.parentId !== null && typeof item.parentId !== 'string') {
        return ApiResponse.badRequest(res, 'parentId must be a string or null');
      }
    }

    next();
  }

  static validateMoveItem(req: Request, res: Response, next: NextFunction) {
    const { parentId, sortOrder } = req.body;

    if (parentId !== undefined && parentId !== null && typeof parentId !== 'string') {
      return ApiResponse.badRequest(res, 'parentId must be a valid UUID string or null');
    }

    if (sortOrder !== undefined && (typeof sortOrder !== 'number' || sortOrder < 0 || !Number.isInteger(sortOrder))) {
      return ApiResponse.badRequest(res, 'sortOrder must be a non-negative integer');
    }

    next();
  }
}
