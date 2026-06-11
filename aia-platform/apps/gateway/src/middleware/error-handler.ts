import type { Context } from 'hono';
import type { StatusCode } from 'hono/utils/http-status';
import { AppError } from '@aia/shared';
import { ZodError } from 'zod';

/**
 * RFC 7807 Problem Details response format.
 */
interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  errors?: Record<string, string[]>;
}

/**
 * Global error handler middleware.
 * Converts all errors to RFC 7807 `application/problem+json` format.
 */
export function errorHandler(err: Error, c: Context): Response {
  const requestId = c.get('requestId') as string | undefined;

  if (err instanceof AppError) {
    const problem: ProblemDetails = {
      type: `https://aia.platform/errors/${err.code.toLowerCase()}`,
      title: err.code,
      status: err.statusCode,
      detail: err.message,
      instance: c.req.path,
    };

    console.error(JSON.stringify({
      level: err.statusCode >= 500 ? 'error' : 'warn',
      message: err.message,
      code: err.code,
      status: err.statusCode,
      path: c.req.path,
      requestId,
    }));

    return c.json(problem, err.statusCode as StatusCode);
  }

  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const path = issue.path.join('.') || '_root';
      if (!fieldErrors[path]) {
        fieldErrors[path] = [];
      }
      fieldErrors[path].push(issue.message);
    }

    const problem: ProblemDetails = {
      type: 'https://aia.platform/errors/validation_error',
      title: 'VALIDATION_ERROR',
      status: 400,
      detail: 'Request validation failed',
      instance: c.req.path,
      errors: fieldErrors,
    };

    console.warn(JSON.stringify({
      level: 'warn',
      message: 'Validation error',
      path: c.req.path,
      requestId,
      fieldCount: Object.keys(fieldErrors).length,
    }));

    return c.json(problem, 400);
  }

  // Unexpected errors -- do not expose internals
  console.error(JSON.stringify({
    level: 'error',
    message: 'Unhandled error',
    error: err.message,
    stack: err.stack,
    path: c.req.path,
    requestId,
  }));

  const problem: ProblemDetails = {
    type: 'https://aia.platform/errors/internal_error',
    title: 'INTERNAL_ERROR',
    status: 500,
    detail: 'An unexpected error occurred',
    instance: c.req.path,
  };

  return c.json(problem, 500);
}
