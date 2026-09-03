import type { Response } from './express.ts';

export interface ApiSuccessResponse<T = any> {
  success: true;
  data?: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export const ApiResponse = {
  success<T>(res: Response, data?: T, statusCodeOrMessage: number | string = 200, message?: string) {
    let statusCode = 200;
    let msg = message;
    if (typeof statusCodeOrMessage === 'number') {
      statusCode = statusCodeOrMessage;
    } else if (typeof statusCodeOrMessage === 'string') {
      msg = statusCodeOrMessage;
    }
    const payload: ApiSuccessResponse<T> = { success: true };
    if (data !== undefined) payload.data = data;
    if (msg) payload.message = msg;
    return res.status(statusCode).json(payload);
  },

  created<T>(res: Response, data?: T, message?: string) {
    return ApiResponse.success(res, data, 201, message);
  },

  error(res: Response, code: string, message: string, statusCode: number = 400, details?: any) {
    const payload: ApiErrorResponse = {
      success: false,
      error: {
        code,
        message,
        details
      }
    };
    return res.status(statusCode).json(payload);
  },

  unauthenticated(res: Response, message: string = 'Authentication required') {
    return ApiResponse.error(res, 'UNAUTHENTICATED', message, 401);
  },

  forbidden(res: Response, message: string = 'You do not have permission to perform this action') {
    return ApiResponse.error(res, 'FORBIDDEN', message, 403);
  },

  notFound(res: Response, message: string = 'Resource not found') {
    return ApiResponse.error(res, 'NOT_FOUND', message, 404);
  },

  badRequest(res: Response, message: string, details?: any) {
    return ApiResponse.error(res, 'VALIDATION_ERROR', message, 400, details);
  },

  tooManyRequests(res: Response, message: string = 'Too many attempts. Please try again later.') {
    return ApiResponse.error(res, 'TOO_MANY_REQUESTS', message, 429);
  }
};
