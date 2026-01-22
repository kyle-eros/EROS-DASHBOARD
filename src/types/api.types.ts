/**
 * @file api.types.ts
 * @description TypeScript type definitions for API responses
 * @layer Types
 * @status PLACEHOLDER - Standard API response patterns
 *
 * Defines consistent API response structures for the application.
 */

/**
 * Standard success response wrapper
 */
export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Standard error response
 */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

/**
 * Union type for API responses
 */
export type ApiResult<T> = ApiResponse<T> | ApiError;

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/**
 * Query parameters for list endpoints
 */
export interface ListQueryParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

/**
 * Server Action result type
 */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Form validation errors from Server Actions
 */
export interface FormErrors {
  [field: string]: string[] | undefined;
}

/**
 * Server Action state for useFormState
 */
export interface ActionState<T = unknown> {
  data?: T;
  error?: string;
  errors?: FormErrors;
}
