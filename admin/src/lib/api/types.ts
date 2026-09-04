export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp?: string;
}

export interface ApiClientError extends Error {
  status: number;
  code: string;
  details?: any;
  isNetworkError?: boolean;
}
