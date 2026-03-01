/**
 * Standard API response wrapper types.
 *
 * All API routes return one of these shapes for consistency.
 * See CLAUDE.md "API Error Format" for conventions.
 */

/** Successful API response containing typed data */
export type ApiSuccessResponse<T> = {
  data: T;
};

/** Error API response with a structured error object */
export type ApiErrorResponse = {
  error: {
    message: string;
    code?: string;
    details?: Record<string, string[]>;
  };
};

/** Discriminated union of success and error response shapes */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
