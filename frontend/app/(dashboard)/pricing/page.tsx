"use client"

import { useState } from "react"
import { useUser, useAuth } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, X, Loader2, Sparkles } from "lucide-react"
import { createCheckoutUrl } from "@/lib/api"

export default function PricingPage() {
  const { user } = useUser()
  const { getToken } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleUpgrade = async () => {
    if (!user?.id || !user?.primaryEmailAddress?.emailAddress) {
      alert('Please sign in first')
      return
    }

    setIsLoading(true)
    try {
      const token = await getToken()
      const checkoutUrl = await createCheckoutUrl(
        user.id,
        user.primaryEmailAddress.emailAddress,
        token
      )

      // Redirect to Polar checkout
      window.location.href = checkoutUrl
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout. Please try again.')
      setIsLoading(false)
    }
  }

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for trying out Certverse",
      features: [
        "2 questions per day",
        "Basic stats tracking",
        "Streak tracking",
        "Mobile app access"
      ],
      limitations: [
        "No explanations",
        "No dashboard access",
        "No domain insights",
        "Limited progress tracking"
      ],
      cta: "Current Plan",
      ctaVariant: "outline" as const,
      popular: false
    },
    {
      name: "Premium",
      price: "$29",
      period: "per month",
      description: "Everything you need to ace your CISA exam",
      features: [
        "Unlimited questions",
        "Detailed explanations for every answer",
        "Advanced dashboard & analytics",
        "Domain-specific insights",
        "Streak tracking & gamification",
        "Daily unlock pacing",
        "Preparedness score",
        "Priority support"
      ],
      limitations: [],
      cta: "Upgrade to Premium",
      ctaVariant: "default" as const,
      popular: true
    },
    {
      name: "Coach",
      price: "$39",
      period: "per month",
      description: "AI-powered coaching (Coming Q2 2025)",
      features: [
        "Everything in Premium",
        "AI Reasoning Tutor",
        "Adaptive domain correction",
        "Socratic Q&A sessions",
        "Personalized study plan",
        "1 free call with CISA mentor",
        "Progress insights & recommendations"
      ],
      limitations: [],
      cta: "Join Waitlist",
      ctaVariant: "secondary" as const,
      popular: false,
      comingSoon: true
    }
  ]

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="secondary">Pricing</Badge>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Choose Your CISA Prep Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start free, upgrade anytime. Cancel whenever you want.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative ${
                plan.popular
                  ? "border-primary shadow-lg scale-105"
                  : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              {plan.comingSoon && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge variant="secondary">
                    Coming Q2 2025
                  </Badge>
                </div>
              )}

              <CardHeader className="pt-8">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground ml-2">{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                  {plan.limitations.map((limitation, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <X className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{limitation}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                {plan.name === "Premium" ? (
                  <Button
                    className="w-full"
                    variant={plan.ctaVariant}
                    onClick={handleUpgrade}
                    disabled={isLoading || plan.comingSoon}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      plan.cta
                    )}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={plan.ctaVariant}
                    disabled={plan.name === "Free" || plan.comingSoon}
                  >
                    {plan.cta}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! You can cancel your subscription at any time. You'll keep premium access
                  until the end of your billing period, then automatically switch to the free plan.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What happens after I cancel?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  You'll be downgraded to the free plan (2 questions/day) at the end of your
                  current billing period. Your progress and stats are preserved.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Do you offer refunds?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We offer a 7-day money-back guarantee. If you're not satisfied, email us
                  within 7 days of purchase for a full refund.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
