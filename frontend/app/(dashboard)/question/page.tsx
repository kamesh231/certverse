"use client"

import { useEffect, useState } from "react"
import { useUser, useAuth } from "@clerk/nextjs"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Lock, Clock, RotateCcw } from "lucide-react"
import Link from "next/link"
import { fetchQuestion, submitAnswer, getRemainingQuestions, Question, SubmitAnswerResponse } from "@/lib/api"
import { CountdownTimer } from "@/components/countdown-timer"

const domainNames: Record<number, string> = {
  1: "Information Systems Governance",
  2: "IT Risk Management",
  3: "Information Systems Acquisition",
  4: "Information Systems Implementation",
  5: "Information Systems Operations",
}

export default function QuestionPage() {
  const { user } = useUser()
  const { getToken } = useAuth()
  const searchParams = useSearchParams()
  const [question, setQuestion] = useState<Question | null>(null)
  const [selectedChoice, setSelectedChoice] = useState<"A" | "B" | "C" | "D" | null>(null)
  const [result, setResult] = useState<SubmitAnswerResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDomain, setSelectedDomain] = useState<number | undefined>(undefined)
  const [isLimitReached, setIsLimitReached] = useState(false)
  const [resetsAt, setResetsAt] = useState<string | null>(null)
  
  // Check if we're in review mode from URL (support both new and legacy parameters)
  const reviewFilterParam = searchParams?.get('reviewFilter') as 'all' | 'correct' | 'incorrect' | null
  const incorrectOnlyParam = searchParams?.get('incorrectOnly') === 'true'
  
  // Determine effective review filter
  const reviewFilter = reviewFilterParam || (incorrectOnlyParam ? 'incorrect' : null)
  
  // Get domain from URL if provided
  useEffect(() => {
    const domainParam = searchParams?.get('domain')
    if (domainParam) {
      const domainNum = parseInt(domainParam, 10)
      if (!isNaN(domainNum) && domainNum >= 1 && domainNum <= 5) {
        setSelectedDomain(domainNum)
      }
    }
  }, [searchParams])

  const loadQuestion = async () => {
    if (!user?.id || !user?.primaryEmailAddress?.emailAddress) {
      setError("Please sign in to view questions")
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    setIsLimitReached(false)
    setResetsAt(null)

    try {
      const token = await getToken()
      const userEmail = user.primaryEmailAddress.emailAddress
      // Validate domain if provided
      const domain = selectedDomain && selectedDomain >= 1 && selectedDomain <= 5 
        ? selectedDomain 
        : undefined
      
      const newQuestion = await fetchQuestion(user.id, userEmail, domain, reviewFilter || undefined, token)
      setQuestion(newQuestion)
      setSelectedChoice(null)
      setResult(null)
    } catch (err: any) {
      console.error("Failed to load question:", err)
      // Use the error message from backend (includes limit messages)
      const errorMessage = err?.message || "Failed to load question. Please try again."
      setError(errorMessage)
      
      // Check if it's a limit error and fetch reset time
      if (err?.status === 403 || errorMessage.includes('daily limit')) {
        setIsLimitReached(true)
        // Try to get resetsAt from error response first
        if (err?.resetsAt) {
          setResetsAt(err.resetsAt)
        } else {
          // Fetch unlock status to get resetsAt
          try {
            const token = await getToken()
            const unlockStatus = await getRemainingQuestions(user.id, token)
            setResetsAt(unlockStatus.resetsAt)
          } catch (unlockErr) {
            // Calculate default reset time (midnight tomorrow)
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            tomorrow.setHours(0, 0, 0, 0)
            setResetsAt(tomorrow.toISOString())
          }
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      loadQuestion()
    }
  }, [user?.id, selectedDomain, reviewFilter])

  const handleSubmit = async (choice: "A" | "B" | "C" | "D") => {
    if (!question || !user?.id || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      const token = await getToken()
      const response = await submitAnswer(user.id, question.id, choice, token)
      setResult(response)
      setSelectedChoice(choice)
    } catch (err: any) {
      console.error("Failed to submit answer:", err)
      setError(err?.message || "Failed to submit answer. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNext = () => {
    loadQuestion()
  }

  const formatResetTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  if (isLoading && !question) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading question...</p>
        </div>
      </div>
    )
  }

  if (isLimitReached) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Daily Limit Reached</CardTitle>
            </div>
            <CardDescription>
              You've reached your daily question limit. Upgrade to Premium for unlimited questions!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {resetsAt && (
              <div className="space-y-3">
                <CountdownTimer 
                  targetDate={resetsAt}
                  onComplete={() => {
                    // Reload question when timer completes
                    loadQuestion()
                  }}
                />
                <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                  <Clock className="h-3 w-3" />
                  <span>Resets at: {formatResetTime(resetsAt)}</span>
                </div>
              </div>
            )}
            <Button asChild className="w-full">
              <Link href="/pricing">Upgrade to Premium</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !question) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={loadQuestion} className="w-full">Try Again</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!question) {
    return null
  }

  // Helper functions for review mode banner
  const getReviewModeBannerColor = (filter: string) => {
    switch (filter) {
      case 'incorrect': return 'orange'
      case 'correct': return 'green'
      case 'all': return 'blue'
      default: return 'gray'
    }
  }

  const getReviewModeTitle = (filter: string) => {
    switch (filter) {
      case 'incorrect': return 'Review Mode: Incorrect Answers'
      case 'correct': return 'Review Mode: Correct Answers'
      case 'all': return 'Review Mode: All Answers'
      default: return 'Review Mode'
    }
  }

  const getReviewModeDescription = (filter: string) => {
    switch (filter) {
      case 'incorrect': 
        return "Reviewing questions you got wrong. Daily limits don't apply."
      case 'correct': 
        return "Reinforcing questions you got right. Daily limits don't apply."
      case 'all': 
        return "Reviewing all questions you've answered. Daily limits don't apply."
      default: 
        return "Review mode active"
    }
  }

  const choices = [
    { value: "A" as const, text: question.choice_a },
    { value: "B" as const, text: question.choice_b },
    { value: "C" as const, text: question.choice_c },
    { value: "D" as const, text: question.choice_d },
  ]

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Review Mode Banner */}
        {reviewFilter && (
          <Card className={`border-${getReviewModeBannerColor(reviewFilter)}-500 bg-${getReviewModeBannerColor(reviewFilter)}-50 dark:bg-${getReviewModeBannerColor(reviewFilter)}-950/30`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <RotateCcw className={`h-5 w-5 text-${getReviewModeBannerColor(reviewFilter)}-600 dark:text-${getReviewModeBannerColor(reviewFilter)}-400`} />
                <div>
                  <p className={`font-semibold text-${getReviewModeBannerColor(reviewFilter)}-900 dark:text-${getReviewModeBannerColor(reviewFilter)}-100`}>
                    {getReviewModeTitle(reviewFilter)}
                  </p>
                  <p className={`text-sm text-${getReviewModeBannerColor(reviewFilter)}-700 dark:text-${getReviewModeBannerColor(reviewFilter)}-200`}>
                    {getReviewModeDescription(reviewFilter)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Domain Selector */}
        {!reviewFilter && (
          <Card>
            <CardHeader>
              <CardTitle>Select Domain (Optional)</CardTitle>
              <CardDescription>Filter questions by CISA domain</CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedDomain?.toString() || "all"}
                onValueChange={(value) => {
                  setSelectedDomain(value === "all" ? undefined : parseInt(value))
                }}
              >
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="All Domains" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Domains</SelectItem>
                  {Object.entries(domainNames).map(([num, name]) => (
                    <SelectItem key={num} value={num}>
                      Domain {num}: {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Question Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <Badge variant="default">Domain {question.domain}</Badge>
            </div>
            <CardTitle className="text-xl leading-relaxed">
              {question.q_text}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {!result ? (
              <>
                <div className="space-y-3">
                  {choices.map((choice) => (
                    <button
                      key={choice.value}
                      onClick={() => handleSubmit(choice.value)}
                      disabled={isSubmitting}
                      className="w-full text-left p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-accent/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center">
                          {choice.value}
                        </span>
                        <span className="flex-1">{choice.text}</span>
                      </div>
                    </button>
                  ))}
                </div>
                {isSubmitting && (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Submitting...</span>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  {choices.map((choice) => {
                    const isSelected = selectedChoice === choice.value
                    const isCorrect = choice.value === result.correctAnswer
                    const isWrong = isSelected && !result.correct

                    return (
                      <div
                        key={choice.value}
                        className={`w-full p-4 rounded-lg border-2 ${
                          isCorrect
                            ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                            : isWrong
                            ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                            : "border-border"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`flex-shrink-0 w-8 h-8 rounded-full font-semibold flex items-center justify-center ${
                              isCorrect
                                ? "bg-green-500 text-white"
                                : isWrong
                                ? "bg-red-500 text-white"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {choice.value}
                          </span>
                          <span className="flex-1">{choice.text}</span>
                          {isCorrect && (
                            <span className="text-green-600 font-semibold">✓ Correct</span>
                          )}
                          {isWrong && (
                            <span className="text-red-600 font-semibold">✗ Incorrect</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {result.explanation && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Explanation:</h4>
                    <p className="text-sm text-muted-foreground">{result.explanation}</p>
                  </div>
                )}

                <Button onClick={handleNext} className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading Next Question...
                    </>
                  ) : (
                    "Next Question"
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {error && result && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
