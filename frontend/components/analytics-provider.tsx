"use client"

import { useEffect, useState } from "react"
import { GoogleAnalytics } from "@next/third-parties/google"
import { initializeAnalytics, hasAnalyticsConsent } from "@/lib/analytics"

export function AnalyticsProvider() {
  const [shouldLoadAnalytics, setShouldLoadAnalytics] = useState(false)

  useEffect(() => {
    // Initialize analytics based on existing consent
    initializeAnalytics()
    
    // Check if we should load Google Analytics
    if (hasAnalyticsConsent()) {
      setShouldLoadAnalytics(true)
    }

    // Listen for storage changes (when user updates consent)
    const handleStorageChange = () => {
      if (hasAnalyticsConsent()) {
        setShouldLoadAnalytics(true)
        initializeAnalytics()
      } else {
        setShouldLoadAnalytics(false)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Also listen for custom event from cookie consent component
    window.addEventListener('cookie-consent-updated', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('cookie-consent-updated', handleStorageChange)
    }
  }, [])

  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  if (!shouldLoadAnalytics || !gaId) {
    return null
  }

  return <GoogleAnalytics gaId={gaId} />
}

