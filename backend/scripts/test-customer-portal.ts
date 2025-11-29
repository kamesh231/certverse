/**
 * Test customer portal URL generation
 */

import { getCustomerPortalUrl } from '../src/lib/polarClient';
import logger from '../src/lib/logger';

async function testCustomerPortal() {
  // Replace with actual customer ID from your Polar dashboard
  const customerId = '5e8e02a7-a1ba-442d-b587-7d44377873fe';

  console.log('🧪 Testing Customer Portal URL Generation\n');
  console.log('Customer ID:', customerId);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    console.log('Creating customer portal session...');
    const portalUrl = await getCustomerPortalUrl(customerId);

    console.log('\n✅ SUCCESS!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Portal URL:', portalUrl);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 Customer can access this URL to manage their subscription');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error);
    console.log('\n🔍 Troubleshooting:');
    console.log('  1. Check POLAR_ACCESS_TOKEN is set in .env');
    console.log('  2. Verify customer ID exists in Polar dashboard');
    console.log('  3. Check if using correct environment (sandbox vs production)');
    process.exit(1);
  }
}

testCustomerPortal();
