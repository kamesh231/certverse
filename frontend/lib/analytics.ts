/**
 * Analytics initialization utilities
 * Handles Google Analytics, PostHog, and Sentry initialization based on cookie consent
 */

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

let posthogInitialized = false;
let sentryInitialized = false;

/**
 * Get cookie preferences from localStorage
 */
export function getCookiePreferences(): CookiePreferences | null {
  if (typeof window === 'undefined') return null;
  
  const preferences = localStorage.getItem('cookie-preferences');
  if (!preferences) return null;
  
  try {
    return JSON.parse(preferences) as CookiePreferences;
  } catch {
    return null;
  }
}

/**
 * Check if analytics consent has been given
 */
export function hasAnalyticsConsent(): boolean {
  const preferences = getCookiePreferences();
  return preferences?.analytics === true;
}

/**
 * Initialize Google Analytics
 * Note: This should be called from a component that conditionally renders GoogleAnalytics
 */
export function initializeGoogleAnalytics(): void {
  // Google Analytics is initialized via @next/third-parties GoogleAnalytics component
  // This function is a placeholder for any additional GA setup if needed
  if (typeof window !== 'undefined' && hasAnalyticsConsent()) {
    const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    if (gaId) {
      // GA is handled by Next.js third-parties component
      // Additional custom setup can be added here if needed
    }
  }
}

/**
 * Initialize PostHog
 */
export function initializePostHog(): void {
  if (typeof window === 'undefined' || posthogInitialized) return;
  
  if (!hasAnalyticsConsent()) {
    return;
  }

  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

  if (!posthogKey) {
    console.warn('PostHog key not found. Skipping PostHog initialization.');
    return;
  }

  try {
    // Dynamic import to avoid SSR issues
    import('posthog-js').then((posthog) => {
      // Check if PostHog is already initialized
      if ((window as any).posthog) {
        // Already initialized, just opt in
        (window as any).posthog.opt_in_capturing();
        posthogInitialized = true;
        return;
      }

      posthog.default.init(posthogKey, {
        api_host: posthogHost,
        loaded: (ph) => {
          posthogInitialized = true;
        },
        capture_pageview: true,
        capture_pageleave: true,
        // Disable session recording by default (can be enabled with explicit consent)
        disable_session_recording: true,
      });
    });
  } catch (error) {
    console.error('Failed to initialize PostHog:', error);
  }
}

/**
 * Disable PostHog
 */
export function disablePostHog(): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Check if PostHog is already loaded
    if ((window as any).posthog) {
      (window as any).posthog.opt_out_capturing();
      posthogInitialized = false;
      return;
    }

    import('posthog-js').then((posthog) => {
      if ((window as any).posthog) {
        (window as any).posthog.opt_out_capturing();
        posthogInitialized = false;
      }
    });
  } catch (error) {
    console.error('Failed to disable PostHog:', error);
  }
}

/**
 * Initialize Sentry (if not already initialized)
 * Note: Sentry is conditionally initialized in sentry.client.config.ts
 * This function ensures Sentry respects consent when sending events
 */
export function initializeSentry(): void {
  if (typeof window === 'undefined' || sentryInitialized) return;
  
  if (!hasAnalyticsConsent()) {
    return;
  }

  // Sentry initialization is handled in sentry.client.config.ts
  // The config file checks consent before initializing
  // This function is a placeholder for any additional setup
  const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (sentryDsn) {
    sentryInitialized = true;
  }
}

/**
 * Initialize all analytics services based on consent
 */
export function initializeAnalytics(): void {
  if (typeof window === 'undefined') return;
  
  const preferences = getCookiePreferences();
  if (!preferences) {
    // No consent given yet, don't initialize
    return;
  }

  if (preferences.analytics) {
    initializeGoogleAnalytics();
    initializePostHog();
    initializeSentry();
  } else {
    disablePostHog();
  }
}

/**
 * Re-initialize analytics when consent changes
 */
export function updateAnalyticsConsent(preferences: CookiePreferences): void {
  if (preferences.analytics) {
    initializeAnalytics();
  } else {
    disablePostHog();
    // Note: GA and Sentry will be handled by conditional rendering/initialization
  }
}

