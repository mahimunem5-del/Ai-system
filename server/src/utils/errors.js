export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_REQUIRED');
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests. Please slow down.', retryAfterSeconds = 60) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', { retryAfterSeconds });
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class TimeoutError extends AppError {
  constructor(message = 'The AI service took too long to respond.', provider = 'upstream') {
    super(message, 504, 'GATEWAY_TIMEOUT', { provider });
    this.provider = provider;
  }
}

export class ProviderError extends AppError {
  constructor(message, provider = 'upstream', originalError = null) {
    super(message, 502, 'PROVIDER_ERROR', { provider });
    this.provider = provider;
    this.originalMessage = originalError?.message || null;
  }
}

export class ConfigurationError extends AppError {
  constructor(message = 'Server configuration error') {
    super(message, 500, 'CONFIGURATION_ERROR');
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'An unexpected internal error occurred') {
    super(message, 500, 'INTERNAL_SERVER_ERROR');
  }
}

/**
 * Strips secrets, keys, and internal stack traces so client responses are safe.
 */
export function formatErrorForClient(err, requestId = null) {
  const isOperational = err instanceof AppError;
  const statusCode = isOperational ? err.statusCode : 500;
  const code = isOperational ? err.code : 'INTERNAL_SERVER_ERROR';

  // Scrub any accidentally included keys in error message
  let safeMessage = isOperational ? err.message : 'An unexpected error occurred. Please try again.';
  safeMessage = safeMessage.replace(/sk-[a-zA-Z0-9_\-]{16,}/g, '[REDACTED]');

  return {
    statusCode,
    body: {
      success: false,
      error: {
        code,
        message: safeMessage,
        details: isOperational && err.details ? err.details : undefined,
        requestId: requestId || undefined
      }
    }
  };
}

export default {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  TimeoutError,
  ProviderError,
  ConfigurationError,
  InternalServerError,
  formatErrorForClient
};
