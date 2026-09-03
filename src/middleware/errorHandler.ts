import type { Request, Response, NextFunction } from '../utils/express.ts';
import { ApiResponse } from '../utils/apiResponse.ts';
import { ENV } from '../config/env.ts';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const statusCode = err.statusCode || err.status || 500;
  if (statusCode >= 500) {
    console.error('Unhandled Server Error:', err);
  }
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = ENV.IS_PROD && statusCode === 500
    ? 'An unexpected error occurred. Please try again later.'
    : err.message || 'Internal server error';

  const details = ENV.IS_PROD ? undefined : err.details;

  return ApiResponse.error(res, code, message, statusCode, details);
}
