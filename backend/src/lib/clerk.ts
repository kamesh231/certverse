import { createClerkClient } from '@clerk/clerk-sdk-node';
import logger from './logger';

// Initialize Clerk client
let clerkClient: ReturnType<typeof createClerkClient> | null = null;

export function getClerkClient() {
  if (!clerkClient) {
    const secretKey = process.env.CLERK_SECRET_KEY;

    if (!secretKey) {
      logger.error('CLERK_SECRET_KEY environment variable is not set');
      throw new Error('CLERK_SECRET_KEY not configured');
    }

    clerkClient = createClerkClient({ secretKey });
    logger.info('Clerk client initialized');
  }

  return clerkClient;
}
