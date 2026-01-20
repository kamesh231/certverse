'use client'

import { useState, useEffect } from 'react'
import { useUser, useAuth } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getUserSubscription, createCheckoutUrl, getCustomerPortalUrl, type Subscription } from "@/lib/api"
import { Crown, CheckCircle2, CreditCard, Loader2, AlertCircle, Sparkles } from "lucide-react"

export default function SubscriptionPage() {
  const { user } = useUser()
  const { getToken } = useAuth()
  const searchParams = useSearchParams()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'quarterly'>('monthly')

  // Read URL parameter for pre-selected plan
  useEffect(() => {
    const preselectedPlan = searchParams?.get('plan') as 'monthly' | 'quarterly' | null
    if (preselectedPlan) {
      setSelectedPlan(preselectedPlan)
    }
  }, [searchParams])

  // Fetch subscription on mount
  useEffect(() => {
    async function fetchSubscription() {
      if (!user) return
      
      try {
        const token = await getToken()
        const data = await getUserSubscription(user.id, token)
        setSubscription(data)
      } catch (error) {
        console.error('Failed to fetch subscription:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubscription()
  }, [user, getToken])

  const handleUpgrade = async (billingInterval: 'monthly' | 'quarterly') => {
    if (!user) return
    
    setIsUpgrading(true)
    try {
      const token = await getToken()
      const checkoutUrl = await createCheckoutUrl(
        user.id,
        user.primaryEmailAddress?.emailAddress || '',
        billingInterval,
        token
      )
      window.location.href = checkoutUrl
    } catch (error) {
      console.error('Failed to create checkout:', error)
      alert('Failed to start checkout. Please try again.')
      setIsUpgrading(false)
    }
  }

  const handleManageSubscription = async () => {
    if (!user) return
    
    try {
      const token = await getToken()
      if (subscription?.polar_customer_id) {
        const portalUrl = await getCustomerPortalUrl(user.id, token)
        window.open(portalUrl, '_blank')
      } else {
        const isSandbox = process.env.NEXT_PUBLIC_POLAR_SANDBOX === 'true'
        const portalDomain = isSandbox ? 'sandbox.polar.sh' : 'polar.sh'
        const orgSlug = process.env.NEXT_PUBLIC_POLAR_ORG_SLUG || 'schedlynksandbox'
        window.open(`https://${portalDomain}/${orgSlug}/portal`, '_blank')
      }
    } catch (error) {
      console.error('Failed to open customer portal:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {subscription?.is_paid ? (
        // PAID USER VIEW
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Crown className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Your Subscription</h1>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-2xl">Premium Plan</CardTitle>
                    <Badge className={
                      subscription?.status === 'past_due' 
                        ? "bg-red-600" 
                        : subscription?.status === 'trialing'
                          ? "bg-amber-600"
                          : subscription?.status === 'canceled'
                            ? "bg-orange-600"
                            : "bg-gradient-to-r from-blue-600 to-indigo-600"
                    }>
                      {subscription?.status === 'trialing' ? 'Trial' :
                       subscription?.status === 'canceled' ? 'Canceling' :
                       subscription?.status === 'past_due' ? 'Payment Failed' :
                       subscription?.status === 'active' ? 'Active' :
                       subscription?.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-lg">
                    {subscription?.billing_interval === 'quarterly' 
                      ? '$59.00 / 3 months' 
                      : '$29.00 / month'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Trial end date */}
              {subscription?.status === 'trialing' && subscription?.current_period_end && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900">
                  <p className="text-sm text-amber-900 dark:text-amber-100 font-medium">
                    Trial ends on {new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    After your trial, you'll be charged the full amount and get unlimited access.
                  </p>
                </div>
              )}

              {/* Renewal date for active paid */}
              {subscription?.is_paid && subscription?.status === 'active' && subscription?.current_period_end && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    Renews on {new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              )}

              {/* Cancellation info */}
              {subscription?.status === 'canceled' && subscription?.cancel_at && (
                <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-900">
                  <p className="text-sm text-orange-900 dark:text-orange-100 font-medium">
                    Access until {new Date(subscription.cancel_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                    Your subscription has been canceled but you can continue using premium features until the end of your billing period.
                  </p>
                </div>
              )}

              {/* Payment failure warning */}
              {subscription?.status === 'past_due' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Payment Failed</AlertTitle>
                  <AlertDescription>
                    Your payment method could not be charged. Please update your payment method to continue your subscription.
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={handleManageSubscription}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Update Payment Method
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Features */}
              <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
                <h4 className="font-semibold">Your Premium Features:</h4>
                <ul className="space-y-2 text-sm">
                  {subscription?.status === 'trialing' ? (
                    <>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-amber-600" />
                        Trial: 15 questions per day
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Full 3000+-question access
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Detailed explanations
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        All domains unlocked
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Progress tracking
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Unlimited questions per day
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Full 3000+-question access
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Detailed explanations
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Progress tracking
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Exam readiness score
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Priority support
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {/* Manage Subscription Button */}
              <Button
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                onClick={handleManageSubscription}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Manage Subscription
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Update payment method, view invoices, or cancel subscription
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        // FREE USER VIEW
        <div className="space-y-6">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-3">
              <Crown className="h-10 w-10 text-primary" />
              <h1 className="text-4xl font-bold">Upgrade to Premium</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Unlock unlimited access to all CISA exam prep features and accelerate your certification journey.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            {/* Monthly Plan */}
            <Card className={`relative transition-all ${selectedPlan === 'monthly' ? 'ring-2 ring-primary shadow-lg' : ''}`}>
              <CardHeader>
                <CardTitle className="text-2xl">Monthly Plan</CardTitle>
                <CardDescription>Perfect for focused study</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$29</span>
                  <span className="text-muted-foreground ml-2">per month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    Full 3000+-question access
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    Domain-wise practice
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    Detailed explanations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    Progress tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    Exam readiness score
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
                    <span className="font-semibold text-amber-600">7-day trial (15 questions/day)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    Unlimited after trial
                  </li>
                </ul>
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  onClick={() => handleUpgrade('monthly')}
                  disabled={isUpgrading}
                >
                  {isUpgrading && selectedPlan === 'monthly' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Choose Monthly'
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Quarterly Plan */}
            <Card className={`relative transition-all ${selectedPlan === 'quarterly' ? 'ring-2 ring-primary shadow-lg' : ''}`}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-green-500 text-white">Save 32%</Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">Quarterly Plan</CardTitle>
                <CardDescription>Best value for your prep</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$59</span>
                  <span className="text-muted-foreground ml-2">per 3 months</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Only $19.67/month - save $28!
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    Full 3000+-question access
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    Domain-wise practice
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    Detailed explanations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    Progress tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    Exam readiness score
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
                    <span className="font-semibold text-amber-600">7-day trial (15 questions/day)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    Unlimited after trial
                  </li>
                </ul>
                <Button 
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  onClick={() => handleUpgrade('quarterly')}
                  disabled={isUpgrading}
                >
                  {isUpgrading && selectedPlan === 'quarterly' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Choose Quarterly'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 p-6 bg-muted/50 rounded-lg text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 inline text-green-600 mr-1" />
              Secure payment via Polar
            </p>
            <p className="text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 inline text-green-600 mr-1" />
              Cancel anytime, no questions asked
            </p>
            <p className="text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 inline text-green-600 mr-1" />
              Join 1,000+ successful CISA candidates
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
