// Sentry temporarily disabled for deployment
// TODO: Re-enable after deployment works

export const initSentry = () => {
  console.warn('⚠️  Sentry disabled (not configured yet)')
}

// Dummy Sentry export to avoid breaking imports
// Matches the real Sentry API signature
export const Sentry = {
  setupExpressErrorHandler: () => {},
  captureException: (error: any, options?: any) => {
    console.error('Error:', error)
    if (options) {
      console.error('Error context:', options)
    }
  }
}
