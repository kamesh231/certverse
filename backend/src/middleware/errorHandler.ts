import { Request, Response, NextFunction } from 'express'
import { Sentry } from '../lib/sentry'
import { logError } from '../lib/logger'

// Custom error class
export class AppError extends Error {
  statusCode: number
  isOperational: boolean

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    Error.captureStackTrace(this, this.constructor)
  }
}

// Global error handler middleware
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const error = err as AppError
  const statusCode = error.statusCode || 500
  const message = error.message || 'Internal server error'

  // Log error
  logError('Error occurred', err, {
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: (req as any).userId,
  })

  // Send to Sentry for non-operational errors
  if (!error.isOperational || statusCode >= 500) {
    Sentry.captureException(err, {
      tags: {
        path: req.path,
        method: req.method,
      },
      user: {
        id: (req as any).userId,
        ip_address: req.ip,
      },
    })
  }

  // Send response
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err,
    }),
  })
}

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
  })
}

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
