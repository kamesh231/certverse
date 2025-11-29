import logger from './logger';

const POLAR_API_BASE = process.env.POLAR_SANDBOX === 'true'
  ? 'https://sandbox-api.polar.sh'
  : 'https://api.polar.sh';

export interface PolarCustomer {
  id: string;
  email: string;
  name: string | null;
  metadata: Record<string, string>;
  created_at: string;
}

export interface PolarSubscription {
  id: string;
  status: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  ended_at: string | null;
  customer_id: string;
  product_id: string;
  metadata: Record<string, string>;
}

/**
 * Fetch a customer from Polar API
 */
export async function fetchPolarCustomer(customerId: string): Promise<PolarCustomer | null> {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;

  if (!accessToken) {
    logger.error('POLAR_ACCESS_TOKEN environment variable is not set');
    throw new Error('POLAR_ACCESS_TOKEN not configured');
  }

  const url = `${POLAR_API_BASE}/v1/customers/${customerId}`;

  try {
    logger.info(`Fetching Polar customer: ${customerId}`);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        logger.warn(`Polar customer not found: ${customerId}`);
        return null;
      }
      const errorText = await response.text();
      throw new Error(`Polar API error (${response.status}): ${errorText}`);
    }

    const customer = await response.json() as PolarCustomer;
    logger.info(`Successfully fetched Polar customer: ${customerId} (${customer.email})`);

    return customer;
  } catch (error) {
    logger.error(`Error fetching Polar customer ${customerId}:`, error);
    throw error;
  }
}

/**
 * Fetch a subscription from Polar API
 */
export async function fetchPolarSubscription(subscriptionId: string): Promise<PolarSubscription | null> {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;

  if (!accessToken) {
    logger.error('POLAR_ACCESS_TOKEN environment variable is not set');
    throw new Error('POLAR_ACCESS_TOKEN not configured');
  }

  const url = `${POLAR_API_BASE}/v1/subscriptions/${subscriptionId}`;

  try {
    logger.info(`Fetching Polar subscription: ${subscriptionId}`);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        logger.warn(`Polar subscription not found: ${subscriptionId}`);
        return null;
      }
      const errorText = await response.text();
      throw new Error(`Polar API error (${response.status}): ${errorText}`);
    }

    const subscription = await response.json() as PolarSubscription;
    logger.info(`Successfully fetched Polar subscription: ${subscriptionId}`);

    return subscription;
  } catch (error) {
    logger.error(`Error fetching Polar subscription ${subscriptionId}:`, error);
    throw error;
  }
}

/**
 * Get Polar customer portal URL for managing subscription
 * Creates a customer portal session via Polar API
 */
export async function getCustomerPortalUrl(customerId: string): Promise<string> {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;

  if (!accessToken) {
    logger.error('POLAR_ACCESS_TOKEN environment variable is not set');
    throw new Error('POLAR_ACCESS_TOKEN not configured');
  }

  const url = `${POLAR_API_BASE}/v1/customer-sessions`;

  try {
    logger.info(`Creating customer portal session for customer: ${customerId}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_id: customerId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Polar API error (${response.status}): ${errorText}`);
    }

    const session = await response.json() as { customer_portal_url: string };
    const portalUrl = session.customer_portal_url;

    logger.info(`Generated customer portal URL for ${customerId}: ${portalUrl}`);

    return portalUrl;
  } catch (error) {
    logger.error(`Error creating customer portal session for ${customerId}:`, error);
    throw error;
  }
}

/**
 * List all subscriptions for an organization (admin function)
 * Useful for sync operations
 */
export async function fetchPolarSubscriptions(organizationId?: string): Promise<PolarSubscription[]> {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  const orgId = organizationId || process.env.POLAR_ORGANIZATION_ID;

  if (!accessToken) {
    logger.error('POLAR_ACCESS_TOKEN environment variable is not set');
    throw new Error('POLAR_ACCESS_TOKEN not configured');
  }

  if (!orgId) {
    logger.error('POLAR_ORGANIZATION_ID environment variable is not set');
    throw new Error('POLAR_ORGANIZATION_ID not configured');
  }

  const url = `${POLAR_API_BASE}/v1/subscriptions?organization_id=${orgId}&limit=100`;

  try {
    logger.info(`Fetching Polar subscriptions for organization: ${orgId}`);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Polar API error (${response.status}): ${errorText}`);
    }

    const data = await response.json() as { items?: PolarSubscription[] };
    const subscriptions = data.items || [];

    logger.info(`Successfully fetched ${subscriptions.length} Polar subscriptions`);

    return subscriptions;
  } catch (error) {
    logger.error('Error fetching Polar subscriptions:', error);
    throw error;
  }
}
