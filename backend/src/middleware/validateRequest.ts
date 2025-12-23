import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import logger from '../lib/logger';

/**
 * Middleware factory to validate request body or query params
 * @param schema - Zod schema to validate against
 * @param source - 'body' or 'query' (default: 'body')
 */
export function validateRequest(
  schema: ZodSchema,
  source: 'body' | 'query' = 'body'
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = source === 'body' ? req.body : req.query;
      const result = schema.safeParse(data);

      if (!result.success) {
        const errors = result.error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
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

      // Replace the original data with validated data
      if (source === 'body') {
        req.body = result.data;
      } else {
        // For query params, merge validated data back
        Object.assign(req.query, result.data);
      }

      next();
    } catch (error) {
      logger.error('Validation middleware error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Validation failed unexpectedly',
      });
    }
  };
}

