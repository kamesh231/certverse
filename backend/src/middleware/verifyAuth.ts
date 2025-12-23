import { Request, Response, NextFunction } from 'express';
import { getClerkClient } from '../lib/clerk';
import logger from '../lib/logger';

// Extend Express Request type to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * Middleware to verify Clerk JWT token and extract userId
 * Requires Authorization: Bearer <token> header
 */
export async function verifyAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header. Expected: Bearer <token>' 
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Token is required' 
      });
      return;
    }

    // Verify token using Clerk
    const clerk = getClerkClient();
    
    // Use Clerk's verifyToken method
    // Note: @clerk/clerk-sdk-node v5 uses verifyToken which returns the decoded JWT
    const decoded = await (clerk as any).verifyToken(token);

    if (!decoded || !decoded.sub) {
      res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid token' 
      });
      return;
    }

    // Attach verified userId to request
    req.userId = decoded.sub;
    
    next();
  } catch (error: any) {
    logger.error('JWT verification error:', {
      error: error.message,
      path: req.path,
      method: req.method,
    });

    // Handle specific Clerk errors
    if (error.message?.includes('expired')) {
      res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Token has expired' 
      });
      return;
    }

    if (error.message?.includes('invalid') || error.message?.includes('malformed')) {
      res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid token format' 
      });
      return;
    }

    // Generic error
    res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Token verification failed' 
    });
  }
}

