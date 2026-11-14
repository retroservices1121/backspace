export type ApiErrorCode = 'unauthorized' | 'network_error' | 'invalid_response' | (string & {});

/** Thrown for every failed API call. Never carries tokens or request/response bodies. */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: ApiErrorCode;

  constructor(status: number, message: string, code?: ApiErrorCode) {
    super(message);
    // Keep `instanceof ApiError` working when classes are transpiled to ES5.
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
