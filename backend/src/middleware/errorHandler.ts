import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from '../lib/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const errors = err.issues.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));

    logger.warn('Validation error:', {
      path: req.path,
      method: req.method,
      errors,
    });

    res.status(400).json({
      error: 'Validation failed',
      details: errors,
    });
    return;
  }

  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
}
