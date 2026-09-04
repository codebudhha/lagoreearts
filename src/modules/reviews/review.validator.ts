/**
 * Module 25: Reviews & Ratings — Express Middleware Validators & Sanitizers
 * Lagoree Arts Luxury E-Commerce Backend
 */

import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';
import type { ReviewStatus } from './review.types.ts';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_STATUSES: ReviewStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'HIDDEN'];
const VALID_PUBLIC_SORTS = ['newest', 'oldest', 'highest_rating', 'lowest_rating', 'helpful'];

/**
 * Sanitize plain review text while preserving Unicode, Devanagari, Sanskrit, Latin diacritics & emojis
 */
export function sanitizeReviewText(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, '') // Strip all HTML tags
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:\s*text\/html/gi, '')
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\s*on\w+\s*=\s*[^>\s]+/gi, '')
    .trim();
}

/**
 * Customer: Create Review Request Validator
 */
export function createReviewValidator(req: Request, res: Response, next: NextFunction) {
  const body = req.body || {};

  // 1. Rating
  if (body.rating === undefined || body.rating === null) {
    return ApiResponse.badRequest(res, 'Rating is required and must be an integer between 1 and 5', { field: 'rating' });
  }
  const ratingNum = Number(body.rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return ApiResponse.badRequest(res, 'Rating must be an integer between 1 and 5', { field: 'rating' });
  }

  // 2. Body
  if (!body.body || typeof body.body !== 'string' || sanitizeReviewText(body.body).length === 0) {
    return ApiResponse.badRequest(res, 'Review body is required and must contain meaningful text', { field: 'body' });
  }
  const sanitizedBody = sanitizeReviewText(body.body);
  if (sanitizedBody.length < 5) {
    return ApiResponse.badRequest(res, 'Review body must be at least 5 characters long', { field: 'body' });
  }
  if (sanitizedBody.length > 3000) {
    return ApiResponse.badRequest(res, 'Review body must not exceed 3000 characters', { field: 'body' });
  }

  // 3. Title (optional)
  let sanitizedTitle: string | null = null;
  if (body.title !== undefined && body.title !== null) {
    if (typeof body.title !== 'string') {
      return ApiResponse.badRequest(res, 'Title must be a string when provided', { field: 'title' });
    }
    sanitizedTitle = sanitizeReviewText(body.title);
    if (sanitizedTitle.length > 150) {
      return ApiResponse.badRequest(res, 'Title must not exceed 150 characters', { field: 'title' });
    }
    if (sanitizedTitle.length === 0) sanitizedTitle = null;
  }

  // 4. Variant ID (optional)
  if (body.variantId !== undefined && body.variantId !== null) {
    if (typeof body.variantId !== 'string' || !UUID_REGEX.test(body.variantId)) {
      return ApiResponse.badRequest(res, 'Invalid variantId UUID format', { field: 'variantId' });
    }
  }

  // Mutate body with sanitized text
  req.body.rating = ratingNum;
  req.body.body = sanitizedBody;
  req.body.title = sanitizedTitle;

  next();
}

/**
 * Customer: Update Review Request Validator
 */
export function updateReviewValidator(req: Request, res: Response, next: NextFunction) {
  const body = req.body || {};

  if (body.rating !== undefined && body.rating !== null) {
    const ratingNum = Number(body.rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return ApiResponse.badRequest(res, 'Rating must be an integer between 1 and 5', { field: 'rating' });
    }
    req.body.rating = ratingNum;
  }

  if (body.body !== undefined) {
    if (typeof body.body !== 'string' || sanitizeReviewText(body.body).length === 0) {
      return ApiResponse.badRequest(res, 'Review body must contain meaningful text', { field: 'body' });
    }
    const sanitizedBody = sanitizeReviewText(body.body);
    if (sanitizedBody.length < 5) {
      return ApiResponse.badRequest(res, 'Review body must be at least 5 characters long', { field: 'body' });
    }
    if (sanitizedBody.length > 3000) {
      return ApiResponse.badRequest(res, 'Review body must not exceed 3000 characters', { field: 'body' });
    }
    req.body.body = sanitizedBody;
  }

  if (body.title !== undefined) {
    if (body.title !== null) {
      if (typeof body.title !== 'string') {
        return ApiResponse.badRequest(res, 'Title must be a string or null', { field: 'title' });
      }
      const sanitizedTitle = sanitizeReviewText(body.title);
      if (sanitizedTitle.length > 150) {
        return ApiResponse.badRequest(res, 'Title must not exceed 150 characters', { field: 'title' });
      }
      req.body.title = sanitizedTitle.length > 0 ? sanitizedTitle : null;
    } else {
      req.body.title = null;
    }
  }

  next();
}

/**
 * Admin: Moderate Review Status Validator
 */
export function adminModerateReviewValidator(req: Request, res: Response, next: NextFunction) {
  const body = req.body || {};

  if (!body.status || typeof body.status !== 'string') {
    return ApiResponse.badRequest(res, 'Review status is required', { field: 'status' });
  }

  const normalizedStatus = body.status.toUpperCase() as ReviewStatus;
  if (!VALID_STATUSES.includes(normalizedStatus)) {
    return ApiResponse.badRequest(
      res,
      `Invalid review status. Allowed values: ${VALID_STATUSES.join(', ')}`,
      { field: 'status' }
    );
  }

  req.body.status = normalizedStatus;
  next();
}

/**
 * Public: Query Parameter Validator
 */
export function publicReviewQueryValidator(req: Request, res: Response, next: NextFunction) {
  const query = req.query || {};

  if (query.page !== undefined) {
    const pageNum = Number(query.page);
    if (isNaN(pageNum) || pageNum < 1) {
      return ApiResponse.badRequest(res, 'Query parameter "page" must be a positive integer', { field: 'page' });
    }
  }

  if (query.limit !== undefined) {
    const limitNum = Number(query.limit);
    if (isNaN(limitNum) || limitNum < 1) {
      return ApiResponse.badRequest(res, 'Query parameter "limit" must be a positive integer between 1 and 50', { field: 'limit' });
    }
  }

  if (query.rating !== undefined) {
    const ratingNum = Number(query.rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return ApiResponse.badRequest(res, 'Query parameter "rating" must be an integer between 1 and 5', { field: 'rating' });
    }
  }

  if (query.sort !== undefined) {
    const sortVal = String(query.sort).toLowerCase();
    if (!VALID_PUBLIC_SORTS.includes(sortVal)) {
      return ApiResponse.badRequest(
        res,
        `Invalid sort option "${query.sort}". Allowed options: ${VALID_PUBLIC_SORTS.join(', ')}`,
        { field: 'sort' }
      );
    }
  }

  next();
}
