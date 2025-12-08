"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Settings, Check } from "lucide-react"
import Link from "next/link"
import { CookiePreferences, updateAnalyticsConsent } from "@/lib/analytics"

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always true, can't be disabled
    analytics: false,
    marketing: false,
  })

  useEffect(() => {
    // Check if consent has been given
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      // Check if preferences exist
      const savedPreferences = localStorage.getItem('cookie-preferences')
      if (savedPreferences) {
        try {
          const prefs = JSON.parse(savedPreferences) as CookiePreferences
          setPreferences(prefs)
        } catch {
          // Invalid preferences, use defaults
        }
      }
      setShowBanner(true)
    } else {
      // Load saved preferences and initialize analytics
      const savedPreferences = localStorage.getItem('cookie-preferences')
      if (savedPreferences) {
        try {
          const prefs = JSON.parse(savedPreferences) as CookiePreferences
          setPreferences(prefs)
          // Initialize analytics based on saved preferences
          updateAnalyticsConsent(prefs)
        } catch {
          // Invalid preferences
        }
      }
    }
  }, [])

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
    }
    savePreferences(allAccepted)
    setShowBanner(false)
  }

  const handleRejectAll = () => {
    const onlyNecessary: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
    }
    savePreferences(onlyNecessary)
    setShowBanner(false)
  }

  const handleSavePreferences = () => {
    savePreferences(preferences)
    setShowBanner(false)
    setShowPreferences(false)
  }

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem('cookie-consent', 'true')
    localStorage.setItem('cookie-preferences', JSON.stringify(prefs))
    localStorage.setItem('cookie-consent-date', new Date().toISOString())
    
    // Update analytics based on preferences
    updateAnalyticsConsent(prefs)
    
    // Dispatch event to notify other components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('cookie-consent-updated'))
    }
  }

  if (!showBanner) return null

  return (
    <>
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
        <Card className="mx-auto max-w-4xl shadow-2xl border-2">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">Cookie Preferences</CardTitle>
                <CardDescription className="mt-1">
                  We use cookies to enhance your experience, analyze site usage, and assist in our marketing efforts.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowBanner(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showPreferences ? (
              <>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={handleAcceptAll} className="flex-1">
                    Accept All
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowPreferences(true)}
                    className="flex-1"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Customize
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleRejectAll}
                    className="flex-1"
                  >
                    Reject All
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  By continuing, you agree to our{" "}
                  <Link href="/privacy" className="underline hover:text-foreground">
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link href="/terms" className="underline hover:text-foreground">
                    Terms of Service
                  </Link>
                  . Learn more in our{" "}
                  <Link href="/cookies" className="underline hover:text-foreground">
                    Cookie Policy
                  </Link>
                  .
                </p>
              </>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">Necessary Cookies</p>
                      <p className="text-sm text-muted-foreground">
                        Required for the site to function properly. Cannot be disabled.
                      </p>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                        <Check className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">Analytics Cookies</p>
                      <p className="text-sm text-muted-foreground">
                        Help us understand how visitors interact with our website (Google Analytics, PostHog, Sentry).
                      </p>
                    </div>
                    <div className="ml-4">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) =>
                          setPreferences({ ...preferences, analytics: e.target.checked })
                        }
                        className="h-5 w-5 rounded border-gray-300 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">Marketing Cookies</p>
                      <p className="text-sm text-muted-foreground">
                        Used to deliver personalized advertisements.
                      </p>
                    </div>
                    <div className="ml-4">
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={(e) =>
                          setPreferences({ ...preferences, marketing: e.target.checked })
                        }
                        className="h-5 w-5 rounded border-gray-300 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleSavePreferences} className="flex-1">
                    Save Preferences
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowPreferences(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowBanner(false)} />
    </>
  )
}

