"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { BookOpen, Clock, Target, TrendingUp, CheckCircle2, XCircle, ArrowRight, Loader2, Flame } from "lucide-react"
import Link from "next/link"
import { getEnhancedUserStats, getUserHistory, EnhancedUserStats, UserResponse } from "@/lib/api"

// CISA Domain mapping
const domainNames: Record<number, string> = {
  1: "Governance",
  2: "Risk Management",
  3: "Acquisition",
  4: "Implementation",
  5: "Operations",
}

const domainFullNames: Record<number, string> = {
  1: "Information Systems Governance",
  2: "Risk Management",
  3: "Information Systems Acquisition",
  4: "Information Systems Implementation",
  5: "Information Systems Operations",
}

export default function DashboardPage() {
  const { user } = useUser()
  const [stats, setStats] = useState<EnhancedUserStats | null>(null)
  const [history, setHistory] = useState<UserResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      if (!user?.id) return

      setIsLoading(true)
      setError(null)

      try {
        const [statsData, historyData] = await Promise.all([
          getEnhancedUserStats(user.id),
          getUserHistory(user.id, 5),
        ])

        setStats(statsData)
        setHistory(historyData)
      } catch (err) {
        console.error("Failed to load dashboard data:", err)
        setError("Failed to load dashboard data. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user?.id])

  // Calculate domain performance from real data
  const domainData = stats?.domainPerformance
    ? stats.domainPerformance.map((dp) => ({
        domain: domainNames[dp.domain] || `Domain ${dp.domain}`,
        score: Math.round(dp.score),
        fullName: domainFullNames[dp.domain] || `Domain ${dp.domain}`,
        total: dp.total,
        correct: dp.correct,
      }))
    : [
        { domain: "Governance", score: 0, fullName: domainFullNames[1], total: 0, correct: 0 },
        { domain: "Risk Management", score: 0, fullName: domainFullNames[2], total: 0, correct: 0 },
        { domain: "Acquisition", score: 0, fullName: domainFullNames[3], total: 0, correct: 0 },
        { domain: "Implementation", score: 0, fullName: domainFullNames[4], total: 0, correct: 0 },
        { domain: "Operations", score: 0, fullName: domainFullNames[5], total: 0, correct: 0 },
      ]

  // Format time ago
  const timeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return "just now"
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
    return `${Math.floor(seconds / 86400)} days ago`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <p className="text-destructive">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    )
  }

  const userName = user?.firstName || "there"
  const accuracy = stats ? Math.round(stats.accuracy) : 0
  const readiness = stats?.overallReadiness || 0

  // Stats data
  const statsCards = [
    {
      title: "Questions Answered",
      value: stats?.totalAnswered.toLocaleString() || "0",
      icon: BookOpen,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "Accuracy Rate",
      value: `${accuracy}%`,
      icon: Target,
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
    },
    {
      title: "Current Streak",
      value: stats?.currentStreak ? `${stats.currentStreak} ${stats.currentStreak === 1 ? 'day' : 'days'}` : "0 days",
      icon: stats && stats.currentStreak >= 3 ? Flame : TrendingUp,
      color: stats && stats.currentStreak >= 3 ? "text-orange-600 dark:text-orange-400" : "text-emerald-600 dark:text-emerald-400",
      bgColor: stats && stats.currentStreak >= 3 ? "bg-orange-100 dark:bg-orange-900/30" : "bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
      title: "Questions Today",
      value: stats?.questionsToday.toLocaleString() || "0",
      icon: Clock,
      color: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-100 dark:bg-violet-900/30",
    },
  ]

  return (
    <div className="min-h-screen bg-background">

      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold tracking-tight">Welcome back, {userName}!</h1>
          <p className="text-lg text-muted-foreground">
            {stats && stats.totalAnswered > 0
              ? "Keep up the momentum and you'll ace that CISA exam."
              : "Let's get started on your CISA exam preparation journey!"}
          </p>
        </div>

        {/* Stats Cards Grid */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="transition-all hover:shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Domain Breakdown Chart */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Domain Performance</CardTitle>
              <CardDescription>Your performance across all 5 CISA domains</CardDescription>
            </CardHeader>
            <CardContent>
              {domainData.some((d) => d.total > 0) ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={domainData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="domain"
                      className="text-xs"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      angle={-15}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      className="text-xs"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      domain={[0, 100]}
                      label={{ value: "Score %", angle: -90, position: "insideLeft" }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="rounded-lg border bg-background p-3 shadow-lg">
                              <p className="mb-1 font-medium">{data.fullName}</p>
                              <p className="text-sm text-muted-foreground">
                                Score: <span className="font-semibold text-foreground">{data.score}%</span>
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {data.correct} correct out of {data.total} questions
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar dataKey="score" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground mb-4">
                    No domain data yet. Answer questions to see your performance across domains!
                  </p>
                  <Button asChild>
                    <Link href="/question">Start Practicing</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your last 5 answered questions</CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground mb-4">No activity yet. Start practicing to see your progress!</p>
                  <Button asChild>
                    <Link href="/question">Start Practicing</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div
                        className={`mt-0.5 rounded-full p-1 ${activity.correct ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"}`}
                      >
                        {activity.correct ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-sm leading-relaxed">Question ID: {activity.question_id.slice(0, 8)}...</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            Answer: {activity.selected_choice}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{timeAgo(activity.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Overall Progress Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Overall Exam Readiness</CardTitle>
            <CardDescription>Based on your performance across all domains</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Estimated Readiness</span>
                <span className="text-muted-foreground">{readiness}%</span>
              </div>
              <Progress value={readiness} className="h-3" />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  {readiness >= 80 ? "You're almost ready!" : readiness >= 60 ? "You're making progress!" : "Keep practicing!"}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {stats && stats.totalAnswered < 150
                    ? `Complete ${150 - stats.totalAnswered} more questions to reach exam readiness`
                    : domainData.filter((d) => d.total >= 5).length < 5
                    ? `Practice all 5 domains (at least 5 questions each) for accurate readiness assessment`
                    : "You're making great progress!"}
                </p>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700" asChild>
                <Link href="/question">
                  Continue Studying
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
