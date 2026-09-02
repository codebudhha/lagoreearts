import type { Request, Response, NextFunction } from '../../utils/express.ts';

function sanitizeHtmlContent(content: string): string {
  if (!content) return content;
  // Strip dangerous script tags, javascript: urls, and event handlers
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*(["'][^"']*["']|[^\s>]+)/gi, '')
    .replace(/javascript\s*:[^"'>]*/gi, '');
}

export function createSanskritEditProfileValidator(req: Request, res: Response, next: NextFunction) {
  const body = req.body;
  const errors: string[] = [];

  if (body.sanskritTitle !== undefined && body.sanskritTitle !== null) {
    if (typeof body.sanskritTitle !== 'string') {
      errors.push('sanskritTitle must be a string');
    } else if (body.sanskritTitle.length > 255) {
      errors.push('sanskritTitle cannot exceed 255 characters');
    }
  }

  if (body.pronunciation !== undefined && body.pronunciation !== null) {
    if (typeof body.pronunciation !== 'string') {
      errors.push('pronunciation must be a string');
    } else if (body.pronunciation.length > 255) {
      errors.push('pronunciation cannot exceed 255 characters');
    }
  }

  if (body.source !== undefined && body.source !== null) {
    if (typeof body.source !== 'string') {
      errors.push('source must be a string');
    } else if (body.source.length > 255) {
      errors.push('source cannot exceed 255 characters');
    }
  }

  if (body.sourceReference !== undefined && body.sourceReference !== null) {
    if (typeof body.sourceReference !== 'string') {
      errors.push('sourceReference must be a string');
    } else if (body.sourceReference.length > 255) {
      errors.push('sourceReference cannot exceed 255 characters');
    }
  }

  if (body.theme !== undefined && body.theme !== null) {
    if (typeof body.theme !== 'string') {
      errors.push('theme must be a string');
    } else if (body.theme.length > 100) {
      errors.push('theme cannot exceed 100 characters');
    }
  }

  if (body.displayOrder !== undefined && body.displayOrder !== null) {
    const num = Number(body.displayOrder);
    if (isNaN(num) || num < 0 || !Number.isInteger(num)) {
      errors.push('displayOrder must be a non-negative integer');
    }
  }

  const isFeatured = body.isFeatured !== undefined ? Boolean(body.isFeatured) : false;
  const isPublished = body.isPublished !== undefined ? Boolean(body.isPublished) : false;

  if (isFeatured && !isPublished) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'SANSKRIT_EDIT_FEATURED_REQUIRES_PUBLISHED',
        message: 'A Sanskrit Edit profile must be published before it can be featured.'
      }
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: errors.join(', ')
      }
    });
  }

  if (body.editorialContent) {
    req.body.editorialContent = sanitizeHtmlContent(body.editorialContent);
  }
  if (body.context) {
    req.body.context = sanitizeHtmlContent(body.context);
  }

  next();
}

export function updateSanskritEditProfileValidator(req: Request, res: Response, next: NextFunction) {
  const body = req.body;
  const errors: string[] = [];

  if (body.sanskritTitle !== undefined && body.sanskritTitle !== null) {
    if (typeof body.sanskritTitle !== 'string') {
      errors.push('sanskritTitle must be a string');
    } else if (body.sanskritTitle.length > 255) {
      errors.push('sanskritTitle cannot exceed 255 characters');
    }
  }

  if (body.pronunciation !== undefined && body.pronunciation !== null) {
    if (typeof body.pronunciation !== 'string') {
      errors.push('pronunciation must be a string');
    } else if (body.pronunciation.length > 255) {
      errors.push('pronunciation cannot exceed 255 characters');
    }
  }

  if (body.source !== undefined && body.source !== null) {
    if (typeof body.source !== 'string') {
      errors.push('source must be a string');
    } else if (body.source.length > 255) {
      errors.push('source cannot exceed 255 characters');
    }
  }

  if (body.sourceReference !== undefined && body.sourceReference !== null) {
    if (typeof body.sourceReference !== 'string') {
      errors.push('sourceReference must be a string');
    } else if (body.sourceReference.length > 255) {
      errors.push('sourceReference cannot exceed 255 characters');
    }
  }

  if (body.theme !== undefined && body.theme !== null) {
    if (typeof body.theme !== 'string') {
      errors.push('theme must be a string');
    } else if (body.theme.length > 100) {
      errors.push('theme cannot exceed 100 characters');
    }
  }

  if (body.displayOrder !== undefined && body.displayOrder !== null) {
    const num = Number(body.displayOrder);
    if (isNaN(num) || num < 0 || !Number.isInteger(num)) {
      errors.push('displayOrder must be a non-negative integer');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: errors.join(', ')
      }
    });
  }

  if (body.editorialContent) {
    req.body.editorialContent = sanitizeHtmlContent(body.editorialContent);
  }
  if (body.context) {
    req.body.context = sanitizeHtmlContent(body.context);
  }

  next();
}

export function reorderSanskritEditValidator(req: Request, res: Response, next: NextFunction) {
  const items = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'SANSKRIT_EDIT_INVALID_ORDER',
        message: 'Reorder payload must be a non-empty array of items'
      }
    });
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.productId || typeof item.productId !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SANSKRIT_EDIT_INVALID_ORDER',
          message: `Item at index ${i} is missing a valid productId`
        }
      });
    }
    const order = Number(item.displayOrder);
    if (isNaN(order) || order < 0 || !Number.isInteger(order)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SANSKRIT_EDIT_INVALID_ORDER',
          message: `Item at index ${i} has an invalid displayOrder. Must be a non-negative integer.`
        }
      });
    }
  }

  next();
}
