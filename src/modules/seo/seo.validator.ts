/**
 * Module 26: SEO Management System — Validation & Sanitization Engine
 * Lagoree Arts Luxury E-Commerce Backend
 */

import type { UpsertSeoMetadataDto, UpdateSeoSiteSettingsDto, SeoEntityType } from './seo.types.ts';

const VALID_ENTITY_TYPES: SeoEntityType[] = [
  'PRODUCT',
  'CATEGORY',
  'COLLECTION',
  'ARTIST',
  'JOURNAL_POST',
  'LOOKBOOK',
  'SANSKRIT_EDIT',
  'ANTIQUE',
  'HOMEPAGE',
  'PAGE'
];

const VALID_ROBOTS_DIRECTIVES = new Set([
  'index,follow',
  'noindex,nofollow',
  'noindex,follow',
  'index,nofollow',
  'index, follow',
  'noindex, nofollow',
  'noindex, follow',
  'index, nofollow'
]);

const VALID_TWITTER_CARDS = new Set(['summary', 'summary_large_image']);

export class SeoValidator {
  /**
   * Validate and sanitize an entity type
   */
  static validateEntityType(type: string): SeoEntityType {
    if (!type || typeof type !== 'string') {
      throw {
        statusCode: 400,
        status: 400,
        code: 'SEO_INVALID_ENTITY_TYPE',
        message: 'Entity type is required and must be a valid string'
      };
    }

    const upper = type.toUpperCase() as SeoEntityType;
    if (!VALID_ENTITY_TYPES.includes(upper)) {
      throw {
        statusCode: 400,
        status: 400,
        code: 'SEO_INVALID_ENTITY_TYPE',
        message: `Invalid entity type '${type}'. Allowed: ${VALID_ENTITY_TYPES.join(', ')}`
      };
    }
    return upper;
  }

  /**
   * Sanitize text by stripping HTML/scripts while preserving Indic diacritics and emojis
   */
  static sanitizeText(text: any, maxLength: number): string | null {
    if (text === null || text === undefined) return null;
    if (typeof text !== 'string') text = String(text);

    let clean = text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/on\w+\s*=\s*(['"]).*?\1/gi, '')
      .replace(/javascript\s*:/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (clean.length > maxLength) {
      clean = clean.substring(0, maxLength).trim();
    }
    return clean || null;
  }

  /**
   * Validate canonical URL with strict security rules
   */
  static validateCanonicalUrl(url: any): string | null {
    if (url === null || url === undefined || url === '') return null;
    if (typeof url !== 'string') {
      throw {
        statusCode: 400,
        status: 400,
        code: 'SEO_INVALID_CANONICAL_URL',
        message: 'Canonical URL must be a valid string'
      };
    }

    const trimmed = url.trim();
    if (!trimmed) return null;

    // Reject dangerous protocols and protocol-relative URLs
    const lower = trimmed.toLowerCase();
    if (
      lower.startsWith('javascript:') ||
      lower.startsWith('data:') ||
      lower.startsWith('vbscript:') ||
      lower.startsWith('file:') ||
      lower.startsWith('//')
    ) {
      throw {
        statusCode: 400,
        status: 400,
        code: 'SEO_INVALID_CANONICAL_URL',
        message: 'Dangerous or protocol-relative canonical URL is not allowed'
      };
    }

    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('Invalid protocol');
      }
      return trimmed;
    } catch {
      throw {
        statusCode: 400,
        status: 400,
        code: 'SEO_INVALID_CANONICAL_URL',
        message: 'Canonical URL must be a valid absolute HTTP or HTTPS URL'
      };
    }
  }

  /**
   * Validate robots directive against strict allowlist
   */
  static validateRobots(robots: any): string | null {
    if (robots === null || robots === undefined || robots === '') return null;
    if (typeof robots !== 'string') {
      throw {
        statusCode: 400,
        status: 400,
        code: 'SEO_INVALID_ROBOTS',
        message: 'Robots directive must be a string'
      };
    }

    const normalized = robots.trim().toLowerCase().replace(/\s+/g, '');
    if (!VALID_ROBOTS_DIRECTIVES.has(normalized)) {
      throw {
        statusCode: 400,
        status: 400,
        code: 'SEO_INVALID_ROBOTS',
        message: `Invalid robots directive '${robots}'. Allowed combinations: index,follow, noindex,nofollow, noindex,follow, index,nofollow`
      };
    }
    return normalized;
  }

  /**
   * Validate twitter card type
   */
  static validateTwitterCard(card: any): string | null {
    if (card === null || card === undefined || card === '') return null;
    if (typeof card !== 'string') {
      throw {
        statusCode: 400,
        status: 400,
        code: 'SEO_INVALID_METADATA',
        message: 'Twitter card must be a string'
      };
    }

    const trimmed = card.trim().toLowerCase();
    if (!VALID_TWITTER_CARDS.has(trimmed)) {
      throw {
        statusCode: 400,
        status: 400,
        code: 'SEO_INVALID_METADATA',
        message: `Invalid Twitter card '${card}'. Allowed: summary, summary_large_image`
      };
    }
    return trimmed;
  }

  /**
   * Validate and sanitize structured data JSON-LD
   */
  static validateStructuredData(data: any): any | null {
    if (data === null || data === undefined || data === '') return null;

    let parsed: any;
    if (typeof data === 'string') {
      try {
        parsed = JSON.parse(data);
      } catch {
        throw {
          statusCode: 400,
          status: 400,
          code: 'SEO_INVALID_STRUCTURED_DATA',
          message: 'Structured data must be valid JSON'
        };
      }
    } else if (typeof data === 'object') {
      parsed = data;
    } else {
      throw {
        statusCode: 400,
        status: 400,
        code: 'SEO_INVALID_STRUCTURED_DATA',
        message: 'Structured data must be an object or JSON string'
      };
    }

    if (Array.isArray(parsed)) {
      throw {
        statusCode: 400,
        status: 400,
        code: 'SEO_INVALID_STRUCTURED_DATA',
        message: 'Structured data top-level must be a JSON object'
      };
    }

    // Must have @context or @type
    if (!parsed['@context'] && !parsed['@type']) {
      throw {
        statusCode: 400,
        status: 400,
        code: 'SEO_INVALID_STRUCTURED_DATA',
        message: 'Structured data object must specify @context or @type'
      };
    }

    // Check for script tags in JSON values
    const jsonStr = JSON.stringify(parsed);
    if (/<script\b/i.test(jsonStr) || /javascript:/i.test(jsonStr)) {
      throw {
        statusCode: 400,
        status: 400,
        code: 'SEO_INVALID_STRUCTURED_DATA',
        message: 'Structured data contains unsafe script injections or protocols'
      };
    }

    return parsed;
  }

  /**
   * Validate and sanitize upsert metadata payload
   */
  static validateUpsertMetadata(body: any): UpsertSeoMetadataDto {
    if (!body || typeof body !== 'object') {
      throw {
        statusCode: 400,
        status: 400,
        code: 'SEO_INVALID_METADATA',
        message: 'Request body must be a JSON object'
      };
    }

    const dto: UpsertSeoMetadataDto = {};

    if (body.metaTitle !== undefined) {
      dto.metaTitle = this.sanitizeText(body.metaTitle, 255);
    }
    if (body.metaDescription !== undefined) {
      dto.metaDescription = this.sanitizeText(body.metaDescription, 1000);
    }
    if (body.canonicalUrl !== undefined) {
      dto.canonicalUrl = this.validateCanonicalUrl(body.canonicalUrl);
    }
    if (body.robots !== undefined) {
      dto.robots = this.validateRobots(body.robots);
    }
    if (body.ogTitle !== undefined) {
      dto.ogTitle = this.sanitizeText(body.ogTitle, 255);
    }
    if (body.ogDescription !== undefined) {
      dto.ogDescription = this.sanitizeText(body.ogDescription, 1000);
    }
    if (body.ogImage !== undefined) {
      dto.ogImage = this.sanitizeText(body.ogImage, 500);
    }
    if (body.twitterTitle !== undefined) {
      dto.twitterTitle = this.sanitizeText(body.twitterTitle, 255);
    }
    if (body.twitterDescription !== undefined) {
      dto.twitterDescription = this.sanitizeText(body.twitterDescription, 1000);
    }
    if (body.twitterImage !== undefined) {
      dto.twitterImage = this.sanitizeText(body.twitterImage, 500);
    }
    if (body.twitterCard !== undefined) {
      dto.twitterCard = this.validateTwitterCard(body.twitterCard);
    }
    if (body.structuredData !== undefined) {
      dto.structuredData = this.validateStructuredData(body.structuredData);
    }

    return dto;
  }

  /**
   * Validate and sanitize site settings payload
   */
  static validateSiteSettings(body: any): UpdateSeoSiteSettingsDto {
    if (!body || typeof body !== 'object') {
      throw {
        statusCode: 400,
        status: 400,
        code: 'SEO_INVALID_METADATA',
        message: 'Request body must be a JSON object'
      };
    }

    const dto: UpdateSeoSiteSettingsDto = {};

    if (body.siteName !== undefined) {
      dto.siteName = this.sanitizeText(body.siteName, 100) || 'Lagoree Arts';
    }
    if (body.defaultTitle !== undefined) {
      dto.defaultTitle = this.sanitizeText(body.defaultTitle, 255) || 'Lagoree Arts | Heritage Luxury & Fine Art';
    }
    if (body.titleTemplate !== undefined) {
      dto.titleTemplate = this.sanitizeText(body.titleTemplate, 100) || '%s | Lagoree Arts';
    }
    if (body.defaultMetaDescription !== undefined) {
      dto.defaultMetaDescription = this.sanitizeText(body.defaultMetaDescription, 1000) || '';
    }
    if (body.defaultOgImage !== undefined) {
      dto.defaultOgImage = this.sanitizeText(body.defaultOgImage, 500) || '';
    }
    if (body.defaultRobots !== undefined) {
      dto.defaultRobots = this.validateRobots(body.defaultRobots) || 'index,follow';
    }
    if (body.canonicalBaseUrl !== undefined) {
      const url = this.validateCanonicalUrl(body.canonicalBaseUrl);
      dto.canonicalBaseUrl = url ? url.replace(/\/+$/, '') : 'https://lagoreearts.com';
    }
    if (body.twitterCard !== undefined) {
      dto.twitterCard = this.validateTwitterCard(body.twitterCard) || 'summary_large_image';
    }
    if (body.organizationName !== undefined) {
      dto.organizationName = this.sanitizeText(body.organizationName, 100) || 'Lagoree Arts';
    }
    if (body.organizationLogo !== undefined) {
      dto.organizationLogo = this.sanitizeText(body.organizationLogo, 500) || '';
    }
    if (body.organizationUrl !== undefined) {
      dto.organizationUrl = this.validateCanonicalUrl(body.organizationUrl) || 'https://lagoreearts.com';
    }

    return dto;
  }
}
