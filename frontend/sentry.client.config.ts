import * as Sentry from "@sentry/nextjs";

// Check if analytics consent has been given
function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const preferences = localStorage.getItem('cookie-preferences');
    if (!preferences) return false;
    
    const prefs = JSON.parse(preferences);
    return prefs.analytics === true;
  } catch {
    return false;
  }
}

// Initialize Sentry (always initialize, but respect consent in beforeSend)
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    // Filter out sensitive data and respect cookie consent
    beforeSend(event, hint) {
      // Don't send events if DSN is not configured
      if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
        return null;
      }

      // Check consent before sending (respects user's cookie preferences)
      if (!hasAnalyticsConsent()) {
        return null;
      }

      // Remove sensitive data from request headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }

      return event;
    },

    // Ignore certain errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      // Random plugins/extensions
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      // Network errors
      'NetworkError',
      'Non-Error promise rejection captured',
    ],

    // Replay integration temporarily disabled
    // TODO: Re-enable with @sentry/replay package when needed
    // integrations: [
    //   replayIntegration({
    //     maskAllText: true,
    //     blockAllMedia: true,
    //   }),
    // ],
  });
}
