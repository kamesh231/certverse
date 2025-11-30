"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import Link from "next/link"
import { getUserSubscription, createCheckoutUrl, type Subscription } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts"
import {
  Trophy,
  TrendingUp,
  Clock,
  RotateCcw,
  RefreshCw,
  Home,
  CheckCircle2,
  XCircle,
  MinusCircle,
  ChevronRight,
  Crown,
  Loader2,
} from "lucide-react"

// Mock test data (this would come from API/props in real app)
const testResults = {
  score: 78,
  totalQuestions: 150,
  correctAnswers: 117,
  incorrectAnswers: 28,
  skippedQuestions: 5,
  passingScore: 75,
  totalTime: "3h 42m",
  averageTimePerQuestion: "1m 28s",
}

// CISA domains performance
const domainPerformance = [
  { domain: "Information Systems Governance", short: "Governance", score: 85, total: 30, correct: 26 },
  { domain: "Risk Management", short: "Risk Mgmt", score: 76, total: 30, correct: 23 },
  { domain: "Information Systems Acquisition", short: "Acquisition", score: 72, total: 30, correct: 22 },
  { domain: "Information Systems Implementation", short: "Implementation", score: 80, total: 30, correct: 24 },
  { domain: "Information Systems Operations", short: "Operations", score: 73, total: 30, correct: 22 },
]

// Mock questions data (first 5 for demo)
const questions = [
  {
    id: 1,
    domain: "Information Systems Governance",
    question: "Which of the following is the PRIMARY role of an information systems auditor?",
    status: "correct",
    userAnswer: "A",
    correctAnswer: "A",
    timeSpent: "2m 15s",
  },
  {
    id: 2,
    domain: "Risk Management",
    question: "What is the MOST important factor when prioritizing IT risks?",
    status: "correct",
    userAnswer: "B",
    correctAnswer: "B",
    timeSpent: "1m 45s",
  },
  {
    id: 3,
    domain: "Information Systems Acquisition",
    question: "During the system development lifecycle, when should security controls be integrated?",
    status: "incorrect",
    userAnswer: "C",
    correctAnswer: "A",
    timeSpent: "1m 30s",
  },
  {
    id: 4,
    domain: "Information Systems Implementation",
    question: "What is the PRIMARY purpose of conducting a post-implementation review?",
    status: "correct",
    userAnswer: "D",
    correctAnswer: "D",
    timeSpent: "2m 05s",
  },
  {
    id: 5,
    domain: "Information Systems Operations",
    question: "Which of the following is the BEST indicator of effective change management?",
    status: "skipped",
    userAnswer: null,
    correctAnswer: "B",
    timeSpent: "0m 45s",
  },
]

export default function ResultsPage() {
  const { user } = useUser()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true)
  const [isUpgrading, setIsUpgrading] = useState(false)

  useEffect(() => {
    async function loadSubscription() {
      if (!user?.id) return

      try {
        const subscriptionData = await getUserSubscription(user.id)
        setSubscription(subscriptionData)
      } catch (error) {
        console.error("Failed to load subscription:", error)
      } finally {
        setIsLoadingSubscription(false)
      }
    }

    loadSubscription()
  }, [user?.id])

  const handleUpgrade = async () => {
    if (!user?.id || !user?.primaryEmailAddress?.emailAddress) {
      alert('Please sign in first')
      return
    }

    setIsUpgrading(true)
    try {
      const checkoutUrl = await createCheckoutUrl(
        user.id,
        user.primaryEmailAddress.emailAddress
      )
      window.location.href = checkoutUrl
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout. Please try again.')
      setIsUpgrading(false)
    }
  }

  const isPassing = testResults.score >= testResults.passingScore
  const statusColors = {
    correct: "text-emerald-600 dark:text-emerald-400",
    incorrect: "text-red-600 dark:text-red-400",
    skipped: "text-amber-600 dark:text-amber-400",
  }

  const statusIcons = {
    correct: CheckCircle2,
    incorrect: XCircle,
    skipped: MinusCircle,
  }

  return (
    <div className="min-h-screen bg-background">

      <main className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold tracking-tight">Test Results</h1>
          <p className="text-muted-foreground">Practice Exam - Completed on {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>

        {/* Score Card */}
        <Card className="mb-8 overflow-hidden border-2">
          <div
            className={`h-2 bg-gradient-to-r ${isPassing ? "from-emerald-500 to-teal-500" : "from-orange-500 to-red-500"}`}
          />
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
              {/* Score Display */}
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br ${isPassing ? "from-emerald-500 to-teal-500" : "from-orange-500 to-red-500"} text-5xl font-bold text-white`}
                  >
                    {testResults.score}%
                  </div>
                  <Badge
                    variant={isPassing ? "default" : "destructive"}
                    className="mt-4 px-4 py-1 text-sm font-semibold"
                  >
                    {isPassing ? (
                      <>
                        <Trophy className="mr-1 h-4 w-4" /> PASSED
                      </>
                    ) : (
                      "NEEDS IMPROVEMENT"
                    )}
                  </Badge>
                </div>

                <div className="space-y-3 border-l pl-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Questions</p>
                    <p className="text-2xl font-bold">{testResults.totalQuestions}</p>
                  </div>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Correct</p>
                      <p className="text-xl font-semibold text-emerald-600 dark:text-emerald-400">
                        {testResults.correctAnswers}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Incorrect</p>
                      <p className="text-xl font-semibold text-red-600 dark:text-red-400">
                        {testResults.incorrectAnswers}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Skipped</p>
                      <p className="text-xl font-semibold text-amber-600 dark:text-amber-400">
                        {testResults.skippedQuestions}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Time Stats */}
              <Card className="bg-muted/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">Time Statistics</h3>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Time</p>
                      <p className="text-xl font-bold">{testResults.totalTime}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Average Per Question</p>
                      <p className="text-lg font-semibold">{testResults.averageTimePerQuestion}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Charts Section */}
        <Tabs defaultValue="bar" className="mb-8">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="bar">Bar Chart</TabsTrigger>
            <TabsTrigger value="radar">Radar Chart</TabsTrigger>
          </TabsList>

          <TabsContent value="bar">
            <Card>
              <CardHeader>
                <CardTitle>Performance by CISA Domain</CardTitle>
                <CardDescription>Your score breakdown across all five CISA knowledge domains</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={domainPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="short"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      className="text-xs"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Bar dataKey="score" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>

                {/* Domain Progress Bars */}
                <div className="mt-8 space-y-4">
                  {domainPerformance.map((domain) => (
                    <div key={domain.domain} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{domain.domain}</span>
                        <span className="text-sm text-muted-foreground">
                          {domain.correct}/{domain.total} ({domain.score}%)
                        </span>
                      </div>
                      <Progress value={domain.score} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="radar">
            <Card>
              <CardHeader>
                <CardTitle>Performance by CISA Domain</CardTitle>
                <CardDescription>Your score breakdown across all five CISA knowledge domains</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={500}>
                  <RadarChart data={domainPerformance}>
                    <PolarGrid className="stroke-muted" />
                    <PolarAngleAxis dataKey="short" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="hsl(var(--chart-1))"
                      fill="hsl(var(--chart-1))"
                      fillOpacity={0.6}
                    />
                    <Legend />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Question Review Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Question Review</CardTitle>
            <CardDescription>Review all questions from this test - click to see detailed explanations</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {questions.map((q) => {
                const StatusIcon = statusIcons[q.status as keyof typeof statusIcons]
                return (
                  <AccordionItem key={q.id} value={`question-${q.id}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex w-full items-center justify-between pr-4 text-left">
                        <div className="flex items-center gap-3">
                          <StatusIcon className={`h-5 w-5 ${statusColors[q.status as keyof typeof statusColors]}`} />
                          <div>
                            <p className="font-medium">Question {q.id}</p>
                            <p className="text-sm text-muted-foreground">{q.domain}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className="font-mono">
                            {q.timeSpent}
                          </Badge>
                          <Badge
                            variant={
                              q.status === "correct"
                                ? "default"
                                : q.status === "incorrect"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {q.status}
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                      <div className="space-y-4 rounded-lg bg-muted/50 p-4">
                        <p className="font-medium">{q.question}</p>
                        <div className="grid gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Your Answer:</span>
                            <Badge variant={q.status === "correct" ? "default" : "destructive"}>
                              {q.userAnswer || "Not answered"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Correct Answer:</span>
                            <Badge variant="default">{q.correctAnswer}</Badge>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-2 bg-transparent"
                          onClick={subscription?.is_paid ? undefined : handleUpgrade}
                          disabled={isUpgrading || isLoadingSubscription}
                        >
                          {isLoadingSubscription ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading...
                            </>
                          ) : subscription?.is_paid ? (
                            <>
                              View Detailed Explanation
                              <ChevronRight className="h-4 w-4" />
                            </>
                          ) : (
                            <>
                              <Crown className="h-4 w-4" />
                              Upgrade to Premium to view detailed explanation
                              <ChevronRight className="h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          <Button
            size="lg"
            className="gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            disabled
          >
            <RotateCcw className="h-5 w-5" />
            Review Mistakes (Coming Soon)
          </Button>
          <Button size="lg" variant="outline" className="gap-2 bg-transparent" asChild>
            <Link href="/question">
              <RefreshCw className="h-5 w-5" />
              Practice More
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="gap-2 bg-transparent">
            <Link href="/dashboard">
              <Home className="h-5 w-5" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        {/* Performance Insights */}
        {!isPassing && (
          <Card className="mt-8 border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30">
            <CardContent className="flex items-start gap-4 p-6">
              <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              <div>
                <h3 className="mb-2 font-semibold text-orange-900 dark:text-orange-100">Keep Practicing!</h3>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  You scored {testResults.score}%, just {testResults.passingScore - testResults.score}% below passing.
                  Focus on improving your scores in Information Systems Acquisition and Operations domains to reach the
                  75% passing threshold.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {isPassing && (
          <Card className="mt-8 border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30">
            <CardContent className="flex items-start gap-4 p-6">
              <Trophy className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              <div>
                <h3 className="mb-2 font-semibold text-emerald-900 dark:text-emerald-100">Excellent Work!</h3>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  You've passed with a score of {testResults.score}%! Continue practicing to maintain your knowledge and
                  consider taking more timed tests to simulate the actual CISA exam experience.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
