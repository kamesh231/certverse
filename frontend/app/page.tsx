"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Brain, MessageSquare, TrendingUp, ArrowRight, Check, Sparkles, X } from "lucide-react"
import { Navbar } from "@/components/navbar"

export default function Home() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [showWaitlistForm, setShowWaitlistForm] = useState(false)
  const [waitlistEmail, setWaitlistEmail] = useState('')
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'quarterly'>('monthly')

  useEffect(() => {
    if (isLoaded && user) {
      // User is authenticated, redirect to dashboard
      router.push('/dashboard')
    }
  }, [user, isLoaded, router])

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!waitlistEmail) return
    
    // Store in localStorage for now
    const existingEmails = JSON.parse(localStorage.getItem('coach_waitlist') || '[]')
    existingEmails.push({
      email: waitlistEmail,
      timestamp: new Date().toISOString()
    })
    localStorage.setItem('coach_waitlist', JSON.stringify(existingEmails))
    
    setWaitlistSubmitted(true)
    setTimeout(() => {
      setShowWaitlistForm(false)
      setWaitlistEmail('')
      setWaitlistSubmitted(false)
    }, 2000)
  }

  // Show loading state while checking authentication
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // If user is authenticated, don't render landing page (redirect will happen)
  if (user) {
    return null
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-blue-800 px-6 py-24 text-white sm:px-12 lg:px-24 lg:py-32">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-block animate-fade-in-up rounded-full bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm">
            🎓 Your Path to CISA Certification
          </div>

          <h1 className="mb-6 animate-fade-in-up text-balance text-5xl font-bold tracking-tight [animation-delay:100ms] sm:text-6xl lg:text-7xl">
            Master CISA. Pass with confidence.
          </h1>

          <p className="mb-10 animate-fade-in-up text-balance text-lg leading-relaxed text-blue-100 [animation-delay:200ms] sm:text-xl">
            AI-powered exam preparation designed to help you succeed. Join thousands of certified professionals who
            trusted Certverse.
          </p>

          <div className="flex animate-fade-in-up flex-col items-center justify-center gap-4 [animation-delay:300ms] sm:flex-row">
            <Button size="lg" className="group bg-white text-blue-700 hover:bg-blue-50" asChild>
              <Link href="/dashboard">
                Start Learning
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b bg-background px-6 py-16 sm:px-12 lg:px-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="animate-fade-in text-center">
              <div className="mb-2 text-4xl font-bold text-blue-600 sm:text-5xl">3,000+</div>
              <div className="text-muted-foreground">Practice Questions</div>
            </div>
            <div className="animate-fade-in text-center [animation-delay:100ms]">
              <div className="mb-2 text-4xl font-bold text-indigo-600 sm:text-5xl">95%</div>
              <div className="text-muted-foreground">Pass Rate</div>
            </div>
            <div className="animate-fade-in text-center [animation-delay:200ms]">
              <div className="mb-2 text-4xl font-bold text-blue-600 sm:text-5xl">1,000+</div>
              <div className="text-muted-foreground">Successful Students</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-24 sm:px-12 lg:px-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Everything you need to succeed
            </h2>
            <p className="mx-auto max-w-2xl text-balance text-lg text-muted-foreground">
              Our platform combines cutting-edge technology with expert content to give you the best preparation
              experience.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <Card className="group animate-fade-in-up border-blue-200 transition-all hover:shadow-lg dark:border-blue-900">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 transition-transform group-hover:scale-110 dark:bg-blue-900/30 dark:text-blue-400">
                  <Brain className="h-6 w-6" />
                </div>
                <CardTitle>Adaptive Learning</CardTitle>
                <CardDescription>
                  AI-powered questions that adapt to your skill level and focus on areas where you need improvement.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group animate-fade-in-up border-indigo-200 transition-all hover:shadow-lg [animation-delay:100ms] dark:border-indigo-900">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 transition-transform group-hover:scale-110 dark:bg-indigo-900/30 dark:text-indigo-400">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <CardTitle>Instant Feedback</CardTitle>
                <CardDescription>
                  Get detailed explanations for every answer, helping you understand concepts deeply and learn from
                  mistakes.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group animate-fade-in-up border-blue-200 transition-all hover:shadow-lg [animation-delay:200ms] dark:border-blue-900">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 transition-transform group-hover:scale-110 dark:bg-blue-900/30 dark:text-blue-400">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <CardTitle>Track Progress</CardTitle>
                <CardDescription>
                  Comprehensive analytics dashboard showing your strengths, weaknesses, and readiness for the exam.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-muted/50 px-6 py-24 sm:px-12 lg:px-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <Badge className="mb-4" variant="secondary">Pricing</Badge>
            <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Simple, transparent pricing
            </h2>
            <p className="mx-auto max-w-2xl text-balance text-lg text-muted-foreground">
              Start free, upgrade when you're ready. No hidden fees.
            </p>
          </div>

          {/* Billing Period Toggle */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex items-center bg-muted p-1 rounded-lg">
              <Button
                variant={billingPeriod === 'monthly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setBillingPeriod('monthly')}
              >
                Monthly
              </Button>
              <Button
                variant={billingPeriod === 'quarterly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setBillingPeriod('quarterly')}
                className="relative"
              >
                Quarterly
                <Badge className="ml-2 bg-green-500 text-white text-xs">Save 32%</Badge>
              </Button>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Free Plan */}
            <Card className="animate-fade-in-up">
              <CardHeader>
                <CardTitle className="text-2xl">Free</CardTitle>
                <CardDescription>Perfect for getting started</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-muted-foreground ml-2">forever</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                    <span className="text-sm">2 questions per day</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                    <span className="text-sm">Basic stats tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                    <span className="text-sm">Streak tracking</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant="outline" asChild>
                  <Link href="/dashboard">Get Started Free</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Premium Plan */}
            <Card className="animate-fade-in-up border-primary shadow-lg scale-105 [animation-delay:100ms]">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
              <CardHeader className="pt-8">
                <CardTitle className="text-2xl">Premium</CardTitle>
                <CardDescription>Everything you need to pass</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{billingPeriod === 'monthly' ? '$29' : '$59'}</span>
                  <span className="text-muted-foreground ml-2">{billingPeriod === 'monthly' ? 'per month' : 'per 3 months'}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                    <span className="text-sm">Unlimited questions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                    <span className="text-sm">Detailed explanations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                    <span className="text-sm">Advanced analytics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                    <span className="text-sm">Priority support</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" asChild>
                  <Link href="/pricing">Upgrade to Premium</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Coach Plan */}
            <Card className="animate-fade-in-up [animation-delay:200ms]">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge variant="secondary">Coming Q2 2026</Badge>
              </div>
              <CardHeader className="pt-8">
                <CardTitle className="text-2xl">Coach</CardTitle>
                <CardDescription>AI-powered coaching</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$39</span>
                  <span className="text-muted-foreground ml-2">per month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                    <span className="text-sm">Everything in Premium</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                    <span className="text-sm">AI Reasoning Tutor</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                    <span className="text-sm">Personalized study plan</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                    <span className="text-sm">1 free CISA mentor call</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant="secondary" 
                  onClick={() => setShowWaitlistForm(true)}
                >
                  Join Waitlist
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Waitlist Modal */}
        {showWaitlistForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4"
                onClick={() => setShowWaitlistForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
              
              <CardHeader>
                <CardTitle>Join Coach Waitlist</CardTitle>
                <CardDescription>
                  Be the first to know when our AI Coach launches in Q2 2026
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {waitlistSubmitted ? (
                  <div className="text-center py-6">
                    <Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <p className="font-semibold text-green-600">You're on the list!</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      We'll email you when Coach is available.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                    <div>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={waitlistEmail}
                        onChange={(e) => setWaitlistEmail(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Join Waitlist
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-blue-600 via-indigo-700 to-blue-800 px-6 py-24 text-white sm:px-12 lg:px-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-6 text-balance text-3xl font-bold sm:text-4xl lg:text-5xl">Ready to ace your CISA exam?</h2>
          <p className="mb-8 text-balance text-lg text-blue-100">
            Join thousands of successful students and start your journey today.
          </p>
          <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50" asChild>
            <Link href="/dashboard">
              Get Started Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background px-6 py-12 sm:px-12 lg:px-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <h3 className="mb-4 text-lg font-semibold">Certverse</h3>
              <p className="text-sm text-muted-foreground">
                The most effective way to prepare for your CISA certification exam.
              </p>
            </div>

            <div>
              <h4 className="mb-4 text-sm font-semibold">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="hover:text-foreground">
                    Pricing
                  </Link>
                </li>
                <li className="flex items-center gap-2">
                  <span className="cursor-not-allowed">
                    Success Stories
                  </span>
                  <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-sm font-semibold">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="cursor-not-allowed">
                    Study Guide
                  </span>
                  <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                </li>
                <li className="flex items-center gap-2">
                  <span className="cursor-not-allowed">
                    Blog
                  </span>
                  <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                </li>
                <li className="flex items-center gap-2">
                  <span className="cursor-not-allowed">
                    FAQ
                  </span>
                  <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-sm font-semibold">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-foreground">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-foreground">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/gdpr" className="hover:text-foreground">
                    GDPR Policy
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="hover:text-foreground">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
            © 2025 Certverse. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
