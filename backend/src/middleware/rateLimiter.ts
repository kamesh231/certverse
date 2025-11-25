import rateLimit from 'express-rate-limit'
import { Request, Response } from 'express'
import { logWarning } from '../lib/logger'

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes',
  },
  handler: (req: Request, res: Response) => {
    logWarning('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    })
    res.status(429).json({
      error: 'Too many requests from this IP, please try again after 15 minutes',
    })
  },
})

// Stricter rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  skipSuccessfulRequests: true,
  message: {
    error: 'Too many authentication attempts, please try again after 15 minutes',
  },
})

// Question fetching rate limiter
export const questionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 questions per minute
  message: {
    error: 'Too many questions requested, please slow down',
  },
})

// Answer submission rate limiter
export const submitLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 submissions per minute
  message: {
    error: 'Too many answer submissions, please slow down',
  },
})
