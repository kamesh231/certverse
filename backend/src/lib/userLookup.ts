import { getClerkClient } from './clerk';
import logger from './logger';

/**
 * Find a user ID by email address
 * Searches through Clerk users to match by email
 *
 * @param email - The email address to search for
 * @returns The Clerk user ID if found, null otherwise
 */
export async function findUserByEmail(email: string): Promise<string | null> {
  try {
    logger.info(`Looking up Clerk user by email: ${email}`);

    const clerkClient = getClerkClient();
    const normalizedEmail = email.toLowerCase().trim();

    // Search for users by email using Clerk API
    const users = await clerkClient.users.getUserList({
      emailAddress: [normalizedEmail],
    });

    if (users.data.length === 0) {
      logger.warn(`No Clerk user found for email: ${email}`);
      return null;
    }

    const user = users.data[0];
    logger.info(`Found Clerk user ${user.id} for email ${email}`);
    return user.id;

  } catch (error) {
    logger.error(`Error in findUserByEmail for ${email}:`, error);
    return null;
  }
}

/**
 * Find multiple users by email addresses
 * Useful for batch operations
 *
 * @param emails - Array of email addresses to search for
 * @returns Map of email to Clerk user ID
 */
export async function findUsersByEmails(emails: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();

  try {
    logger.info(`Looking up ${emails.length} Clerk users by email`);

    const clerkClient = getClerkClient();
    const normalizedEmails = emails.map(e => e.toLowerCase().trim());

    // Clerk API allows searching by multiple emails
    const users = await clerkClient.users.getUserList({
      emailAddress: normalizedEmails,
    });

    for (const user of users.data) {
      const primaryEmail = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId);
      if (primaryEmail) {
        result.set(primaryEmail.emailAddress, user.id);
      }
    }

    logger.info(`Found ${result.size} Clerk users out of ${emails.length} emails`);

    return result;

  } catch (error) {
    logger.error('Error in findUsersByEmails:', error);
    return result;
  }
}
