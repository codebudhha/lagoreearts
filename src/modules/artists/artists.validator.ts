import type { Request, Response, NextFunction } from '../../utils/express.ts';
import { ApiResponse } from '../../utils/apiResponse.ts';
import type { ArtistRole, ArtistMediaRole, ArtistStatus } from './artists.types.ts';

function sanitizeHtmlContent(content: string): string {
  if (!content) return content;
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\s*on\w+\s*=\s*[^>\s]+/gi, '');
}

const VALID_STATUSES: ArtistStatus[] = ['ACTIVE', 'INACTIVE'];
const VALID_ROLES: ArtistRole[] = ['ARTIST', 'MAKER', 'DESIGNER', 'ATTRIBUTED_TO'];
const VALID_MEDIA_ROLES: ArtistMediaRole[] = ['PROFILE', 'GALLERY', 'OG'];

export function createArtistValidator(req: Request, res: Response, next: NextFunction) {
  const body = req.body || {};

  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    return ApiResponse.badRequest(res, 'Artist name is required and must be a non-empty string', { field: 'name' });
  }

  if (body.name.trim().length > 150) {
    return ApiResponse.badRequest(res, 'Artist name must not exceed 150 characters', { field: 'name' });
  }

  if (body.slug !== undefined && body.slug !== null) {
    if (typeof body.slug !== 'string' || body.slug.trim().length === 0) {
      return ApiResponse.badRequest(res, 'Slug must be a non-empty string when provided', { field: 'slug' });
    }
    if (body.slug.trim().length > 180) {
      return ApiResponse.badRequest(res, 'Slug must not exceed 180 characters', { field: 'slug' });
    }
  }

  if (body.shortBio !== undefined && body.shortBio !== null) {
    if (typeof body.shortBio !== 'string') {
      return ApiResponse.badRequest(res, 'shortBio must be a string', { field: 'shortBio' });
    }
    if (body.shortBio.length > 500) {
      return ApiResponse.badRequest(res, 'shortBio must not exceed 500 characters', { field: 'shortBio' });
    }
  }

  if (body.biography !== undefined && body.biography !== null) {
    if (typeof body.biography !== 'string') {
      return ApiResponse.badRequest(res, 'biography must be a string', { field: 'biography' });
    }
    req.body.biography = sanitizeHtmlContent(body.biography);
  }

  if (body.birthYear !== undefined && body.birthYear !== null) {
    const by = Number(body.birthYear);
    if (!Number.isInteger(by) || by < -5000 || by > 2100) {
      return ApiResponse.error(res, 'ARTIST_INVALID_BIRTH_YEAR', 'Birth year must be a valid integer between -5000 and 2100', 400, { field: 'birthYear' });
    }
  }

  if (body.deathYear !== undefined && body.deathYear !== null) {
    const dy = Number(body.deathYear);
    if (!Number.isInteger(dy) || dy < -5000 || dy > 2100) {
      return ApiResponse.error(res, 'ARTIST_INVALID_DEATH_YEAR', 'Death year must be a valid integer between -5000 and 2100', 400, { field: 'deathYear' });
    }
  }

  if (body.birthYear !== undefined && body.birthYear !== null && body.deathYear !== undefined && body.deathYear !== null) {
    if (Number(body.deathYear) < Number(body.birthYear)) {
      return ApiResponse.error(res, 'ARTIST_INVALID_DATE_RANGE', 'Death year cannot be earlier than birth year', 400, { field: 'deathYear' });
    }
  }

  if (body.status !== undefined && body.status !== null) {
    if (!VALID_STATUSES.includes(body.status)) {
      return ApiResponse.badRequest(res, `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, { field: 'status' });
    }
  }

  if (body.sortOrder !== undefined && body.sortOrder !== null) {
    const so = Number(body.sortOrder);
    if (!Number.isInteger(so) || so < 0) {
      return ApiResponse.badRequest(res, 'sortOrder must be a non-negative integer', { field: 'sortOrder' });
    }
  }

  if (body.nationality && (typeof body.nationality !== 'string' || body.nationality.length > 100)) {
    return ApiResponse.badRequest(res, 'nationality must not exceed 100 characters', { field: 'nationality' });
  }

  if (body.origin && (typeof body.origin !== 'string' || body.origin.length > 150)) {
    return ApiResponse.badRequest(res, 'origin must not exceed 150 characters', { field: 'origin' });
  }

  if (body.tradition && (typeof body.tradition !== 'string' || body.tradition.length > 150)) {
    return ApiResponse.badRequest(res, 'tradition must not exceed 150 characters', { field: 'tradition' });
  }

  if (body.medium && (typeof body.medium !== 'string' || body.medium.length > 150)) {
    return ApiResponse.badRequest(res, 'medium must not exceed 150 characters', { field: 'medium' });
  }

  if (body.specialization && (typeof body.specialization !== 'string' || body.specialization.length > 150)) {
    return ApiResponse.badRequest(res, 'specialization must not exceed 150 characters', { field: 'specialization' });
  }

  if (body.signature && (typeof body.signature !== 'string' || body.signature.length > 255)) {
    return ApiResponse.badRequest(res, 'signature must not exceed 255 characters', { field: 'signature' });
  }

  next();
}

export function updateArtistValidator(req: Request, res: Response, next: NextFunction) {
  const body = req.body || {};

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length === 0) {
      return ApiResponse.badRequest(res, 'Artist name must be a non-empty string', { field: 'name' });
    }
    if (body.name.trim().length > 150) {
      return ApiResponse.badRequest(res, 'Artist name must not exceed 150 characters', { field: 'name' });
    }
  }

  if (body.slug !== undefined && body.slug !== null) {
    if (typeof body.slug !== 'string' || body.slug.trim().length === 0) {
      return ApiResponse.badRequest(res, 'Slug must be a non-empty string when provided', { field: 'slug' });
    }
    if (body.slug.trim().length > 180) {
      return ApiResponse.badRequest(res, 'Slug must not exceed 180 characters', { field: 'slug' });
    }
  }

  if (body.shortBio !== undefined && body.shortBio !== null) {
    if (typeof body.shortBio !== 'string') {
      return ApiResponse.badRequest(res, 'shortBio must be a string', { field: 'shortBio' });
    }
    if (body.shortBio.length > 500) {
      return ApiResponse.badRequest(res, 'shortBio must not exceed 500 characters', { field: 'shortBio' });
    }
  }

  if (body.biography !== undefined && body.biography !== null) {
    if (typeof body.biography !== 'string') {
      return ApiResponse.badRequest(res, 'biography must be a string', { field: 'biography' });
    }
    req.body.biography = sanitizeHtmlContent(body.biography);
  }

  if (body.birthYear !== undefined && body.birthYear !== null) {
    const by = Number(body.birthYear);
    if (!Number.isInteger(by) || by < -5000 || by > 2100) {
      return ApiResponse.error(res, 'ARTIST_INVALID_BIRTH_YEAR', 'Birth year must be a valid integer between -5000 and 2100', 400, { field: 'birthYear' });
    }
  }

  if (body.deathYear !== undefined && body.deathYear !== null) {
    const dy = Number(body.deathYear);
    if (!Number.isInteger(dy) || dy < -5000 || dy > 2100) {
      return ApiResponse.error(res, 'ARTIST_INVALID_DEATH_YEAR', 'Death year must be a valid integer between -5000 and 2100', 400, { field: 'deathYear' });
    }
  }

  if (body.birthYear !== undefined && body.birthYear !== null && body.deathYear !== undefined && body.deathYear !== null) {
    if (Number(body.deathYear) < Number(body.birthYear)) {
      return ApiResponse.error(res, 'ARTIST_INVALID_DATE_RANGE', 'Death year cannot be earlier than birth year', 400, { field: 'deathYear' });
    }
  }

  if (body.status !== undefined && body.status !== null) {
    if (!VALID_STATUSES.includes(body.status)) {
      return ApiResponse.badRequest(res, `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, { field: 'status' });
    }
  }

  if (body.sortOrder !== undefined && body.sortOrder !== null) {
    const so = Number(body.sortOrder);
    if (!Number.isInteger(so) || so < 0) {
      return ApiResponse.badRequest(res, 'sortOrder must be a non-negative integer', { field: 'sortOrder' });
    }
  }

  if (body.nationality && (typeof body.nationality !== 'string' || body.nationality.length > 100)) {
    return ApiResponse.badRequest(res, 'nationality must not exceed 100 characters', { field: 'nationality' });
  }

  if (body.origin && (typeof body.origin !== 'string' || body.origin.length > 150)) {
    return ApiResponse.badRequest(res, 'origin must not exceed 150 characters', { field: 'origin' });
  }

  if (body.tradition && (typeof body.tradition !== 'string' || body.tradition.length > 150)) {
    return ApiResponse.badRequest(res, 'tradition must not exceed 150 characters', { field: 'tradition' });
  }

  if (body.medium && (typeof body.medium !== 'string' || body.medium.length > 150)) {
    return ApiResponse.badRequest(res, 'medium must not exceed 150 characters', { field: 'medium' });
  }

  if (body.specialization && (typeof body.specialization !== 'string' || body.specialization.length > 150)) {
    return ApiResponse.badRequest(res, 'specialization must not exceed 150 characters', { field: 'specialization' });
  }

  if (body.signature && (typeof body.signature !== 'string' || body.signature.length > 255)) {
    return ApiResponse.badRequest(res, 'signature must not exceed 255 characters', { field: 'signature' });
  }

  next();
}

export function reorderArtistsValidator(req: Request, res: Response, next: NextFunction) {
  const items = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return ApiResponse.badRequest(res, 'Request body must be a non-empty array of artist reorder items');
  }

  for (const item of items) {
    if (!item.id || typeof item.id !== 'string') {
      return ApiResponse.badRequest(res, 'Each reorder item must have a valid artist id string');
    }
    if (item.sortOrder === undefined || !Number.isInteger(Number(item.sortOrder)) || Number(item.sortOrder) < 0) {
      return ApiResponse.badRequest(res, 'Each reorder item must have a non-negative integer sortOrder');
    }
  }

  next();
}

export function attachProductArtistValidator(req: Request, res: Response, next: NextFunction) {
  const body = req.body || {};

  if (!body.artistId || typeof body.artistId !== 'string' || body.artistId.trim().length === 0) {
    return ApiResponse.badRequest(res, 'artistId is required', { field: 'artistId' });
  }

  if (body.role !== undefined && body.role !== null) {
    if (!VALID_ROLES.includes(body.role)) {
      return ApiResponse.badRequest(res, `Invalid artist role. Must be one of: ${VALID_ROLES.join(', ')}`, { field: 'role' });
    }
  }

  if (body.sortOrder !== undefined && body.sortOrder !== null) {
    const so = Number(body.sortOrder);
    if (!Number.isInteger(so) || so < 0) {
      return ApiResponse.badRequest(res, 'sortOrder must be a non-negative integer', { field: 'sortOrder' });
    }
  }

  next();
}

export function updateProductArtistValidator(req: Request, res: Response, next: NextFunction) {
  const body = req.body || {};

  if (body.role !== undefined && body.role !== null) {
    if (!VALID_ROLES.includes(body.role)) {
      return ApiResponse.badRequest(res, `Invalid artist role. Must be one of: ${VALID_ROLES.join(', ')}`, { field: 'role' });
    }
  }

  if (body.sortOrder !== undefined && body.sortOrder !== null) {
    const so = Number(body.sortOrder);
    if (!Number.isInteger(so) || so < 0) {
      return ApiResponse.badRequest(res, 'sortOrder must be a non-negative integer', { field: 'sortOrder' });
    }
  }

  next();
}

export function reorderProductArtistsValidator(req: Request, res: Response, next: NextFunction) {
  const items = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return ApiResponse.badRequest(res, 'Request body must be a non-empty array of product artist reorder items');
  }

  for (const item of items) {
    if (!item.artistId || typeof item.artistId !== 'string') {
      return ApiResponse.badRequest(res, 'Each reorder item must have an artistId');
    }
    if (item.role && !VALID_ROLES.includes(item.role)) {
      return ApiResponse.badRequest(res, `Invalid artist role: ${item.role}`);
    }
    if (item.sortOrder === undefined || !Number.isInteger(Number(item.sortOrder)) || Number(item.sortOrder) < 0) {
      return ApiResponse.badRequest(res, 'Each reorder item must have a non-negative integer sortOrder');
    }
  }

  next();
}

export function attachArtistMediaValidator(req: Request, res: Response, next: NextFunction) {
  const body = req.body || {};

  if (!body.mediaId || typeof body.mediaId !== 'string' || body.mediaId.trim().length === 0) {
    return ApiResponse.badRequest(res, 'mediaId is required', { field: 'mediaId' });
  }

  if (body.role !== undefined && body.role !== null) {
    if (!VALID_MEDIA_ROLES.includes(body.role)) {
      return ApiResponse.badRequest(res, `Invalid media role. Must be one of: ${VALID_MEDIA_ROLES.join(', ')}`, { field: 'role' });
    }
  }

  if (body.sortOrder !== undefined && body.sortOrder !== null) {
    const so = Number(body.sortOrder);
    if (!Number.isInteger(so) || so < 0) {
      return ApiResponse.badRequest(res, 'sortOrder must be a non-negative integer', { field: 'sortOrder' });
    }
  }

  next();
}

export function reorderArtistMediaValidator(req: Request, res: Response, next: NextFunction) {
  const items = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return ApiResponse.badRequest(res, 'Request body must be a non-empty array of artist media reorder items');
  }

  for (const item of items) {
    if (!item.mediaId || typeof item.mediaId !== 'string') {
      return ApiResponse.badRequest(res, 'Each reorder item must have a mediaId');
    }
    if (item.role && !VALID_MEDIA_ROLES.includes(item.role)) {
      return ApiResponse.badRequest(res, `Invalid media role: ${item.role}`);
    }
    if (item.sortOrder === undefined || !Number.isInteger(Number(item.sortOrder)) || Number(item.sortOrder) < 0) {
      return ApiResponse.badRequest(res, 'Each reorder item must have a non-negative integer sortOrder');
    }
  }

  next();
}
