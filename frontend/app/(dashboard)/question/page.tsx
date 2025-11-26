"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import Link from "next/link"
import { QuestionCard } from "@/components/question-card"
import { fetchQuestion, submitAnswer, getRemainingQuestions, Question, SubmitAnswerResponse, UnlockStatus } from "@/lib/api"
import { Loader2, AlertCircle, Flame } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function QuestionPage() {
  const { user } = useUser()
  const [question, setQuestion] = useState<Question | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unlockStatus, setUnlockStatus] = useState<UnlockStatus | null>(null)

  const fetchUnlockStatus = async () => {
    if (!user?.id) return

    try {
      const status = await getRemainingQuestions(user.id)
      setUnlockStatus(status)
      return status
    } catch (err) {
      console.error("Failed to fetch unlock status:", err)
      return null
    }
  }

  const loadQuestion = async () => {
    if (!user?.id) return

    setIsLoading(true)
    setError(null)

    try {
      // First check if user has questions remaining
      const status = await fetchUnlockStatus()

      if (status && status.remaining <= 0) {
        // No questions remaining today
        setIsLoading(false)
        return
      }

      const newQuestion = await fetchQuestion(user.id)
      setQuestion(newQuestion)
    } catch (err) {
      console.error("Failed to load question:", err)
      setError("Failed to load question. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadQuestion()
  }, [user?.id])

  const handleSubmit = async (choice: "A" | "B" | "C" | "D"): Promise<SubmitAnswerResponse> => {
    if (!user?.id || !question) {
      throw new Error("Missing user or question")
    }

    const result = await submitAnswer(user.id, question.id, choice)

    // Refresh unlock status after submitting
    await fetchUnlockStatus()

    return result
  }

  const handleNext = () => {
    loadQuestion()
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-8">
        {/* Show remaining counter if unlock status is loaded */}
        {unlockStatus && (
          <div className="mb-6 flex justify-center gap-4">
            <Badge
              variant={unlockStatus.remaining > 0 ? "default" : "secondary"}
              className="text-lg px-4 py-2"
            >
              Questions today: {unlockStatus.total - unlockStatus.remaining} / {unlockStatus.total}
            </Badge>
            {unlockStatus.streak > 0 && (
              <Badge
                variant="outline"
                className={`text-lg px-4 py-2 ${unlockStatus.streak >= 3 ? 'border-orange-500 text-orange-600' : ''}`}
              >
                {unlockStatus.streak >= 3 && <Flame className="h-4 w-4 mr-1 inline" />}
                Streak: {unlockStatus.streak} {unlockStatus.streak === 1 ? 'day' : 'days'}
              </Badge>
            )}
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading question...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-destructive font-medium">{error}</p>
            <Button onClick={loadQuestion} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {/* Show limit reached message */}
        {!isLoading && unlockStatus && unlockStatus.remaining === 0 && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Great work today! 🎉</CardTitle>
              <CardDescription>You've completed all {unlockStatus.total} questions for today</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Questions reset in:</p>
                <CountdownTimer resetsAt={unlockStatus.resetsAt} />
              </div>

              <div className="flex flex-col gap-2">
                <Button asChild className="w-full">
                  <Link href="/dashboard">View Your Progress</Link>
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Come back tomorrow to continue your {unlockStatus.streak + 1} day streak!
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Show question if there are remaining questions */}
        {!isLoading && !error && question && unlockStatus && unlockStatus.remaining > 0 && (
          <QuestionCard
            question={question}
            onSubmit={handleSubmit}
            onNext={handleNext}
          />
        )}
      </main>
    </div>
  )
}

// Countdown timer component
function CountdownTimer({ resetsAt }: { resetsAt: string }) {
  const [timeLeft, setTimeLeft] = useState("")

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime()
      const reset = new Date(resetsAt).getTime()
      const diff = reset - now

      if (diff <= 0) {
        setTimeLeft("Ready now!")
        // Refresh page when timer reaches 0
        setTimeout(() => window.location.reload(), 1000)
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
      }
    }

    // Update immediately
    updateTimer()

    // Then update every second
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [resetsAt])

  return (
    <div className="text-3xl font-bold text-center py-4 bg-muted rounded-lg">
      {timeLeft}
    </div>
  )
}
