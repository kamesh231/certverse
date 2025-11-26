// Sentry temporarily disabled for deployment
// TODO: Re-enable after deployment works

export const initSentry = () => {
  console.warn('⚠️  Sentry disabled (not configured yet)')
}

// Dummy Sentry export to avoid breaking imports
export const Sentry = {
  setupExpressErrorHandler: () => {},
  captureException: (error: any) => console.error('Error:', error)
}
