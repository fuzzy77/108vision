import type { Context } from 'hono';
import { AppError } from '@aia/shared';

type ErrorType = 'authentication_error' | 'invalid_request_error' | 'rate_limit_error' | 'server_error' | 'not_found_error';

function mapStatusToType(status: number): ErrorType {
  switch (status) {
    case 401: return 'authentication_error';
    case 403: return 'authentication_error';
    case 400: return 'invalid_request_error';
    case 404: return 'not_found_error';
    case 429: return 'rate_limit_error';
    default: return 'server_error';
  }
}

export function proxyErrorHandler(err: Error, c: Context): Response {
  if (err instanceof AppError) {
    const status = err.statusCode ?? 500;
    return c.json(
      {
        error: {
          message: err.message,
          type: mapStatusToType(status),
          code: err.code.toLowerCase(),
        },
      },
      status as 400,
    );
  }

  if (err.name === 'ZodError') {
    return c.json(
      {
        error: {
          message: `Invalid request: ${err.message}`,
          type: 'invalid_request_error' as const,
          code: 'validation_error',
        },
      },
      400,
    );
  }

  console.error(JSON.stringify({
    level: 'error',
    message: 'Proxy unhandled error',
    error: err.message,
    stack: err.stack,
  }));

  return c.json(
    {
      error: {
        message: 'An internal error occurred',
        type: 'server_error' as const,
        code: 'internal_error',
      },
    },
    500,
  );
}
