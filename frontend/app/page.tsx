import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, MessageSquare, TrendingUp, ArrowRight } from "lucide-react"
import { Navbar } from "@/components/navbar"

export default function Home() {
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
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
            >
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b bg-background px-6 py-16 sm:px-12 lg:px-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="animate-fade-in text-center">
              <div className="mb-2 text-4xl font-bold text-blue-600 sm:text-5xl">10,000+</div>
              <div className="text-muted-foreground">Practice Questions</div>
            </div>
            <div className="animate-fade-in text-center [animation-delay:100ms]">
              <div className="mb-2 text-4xl font-bold text-indigo-600 sm:text-5xl">95%</div>
              <div className="text-muted-foreground">Pass Rate</div>
            </div>
            <div className="animate-fade-in text-center [animation-delay:200ms]">
              <div className="mb-2 text-4xl font-bold text-blue-600 sm:text-5xl">50,000+</div>
              <div className="text-muted-foreground">Successful Students</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-24 sm:px-12 lg:px-24">
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
                  <Link href="#" className="hover:text-foreground">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Success Stories
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-sm font-semibold">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Study Guide
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    FAQ
                  </Link>
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
                  <Link href="#" className="hover:text-foreground">
                    Privacy
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
