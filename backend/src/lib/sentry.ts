// Sentry temporarily disabled for deployment
// TODO: Re-enable after deployment works

export const initSentry = () => {
  console.warn('⚠️  Sentry disabled (not configured yet)')
}

// Type definition to match real Sentry API
interface SentryOptions {
  tags?: Record<string, string>
  user?: {
    id?: string
    ip_address?: string
  }
}

interface SentryInterface {
  setupExpressErrorHandler: () => void
  captureException: (error: any, options?: SentryOptions) => void
}

// Dummy Sentry export to avoid breaking imports
// Matches the real Sentry API signature
export const Sentry: SentryInterface = {
  setupExpressErrorHandler: () => {},
  captureException: (error: any, options?: SentryOptions) => {
    console.error('Error:', error)
    if (options) {
      console.error('Error context:', options)
    }
  }
}
