"use client"

import { useEffect, useState } from "react"
import { useUser, useAuth } from "@clerk/nextjs"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Lock, Clock, RotateCcw, BookOpen, Crown, Sparkles } from "lucide-react"
import Link from "next/link"
import { fetchQuestion, submitAnswer, getRemainingQuestions, getUserSubscription, Question, SubmitAnswerResponse, Subscription } from "@/lib/api"
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
  
  // Review mode tracking
  const [reviewedQuestions, setReviewedQuestions] = useState<Set<string>>(new Set())
  const [totalReviewQuestions, setTotalReviewQuestions] = useState<number>(0)
  const [isReviewComplete, setIsReviewComplete] = useState(false)
  
  // Subscription tracking
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  
  // Check if we're in review mode from URL (support both new and legacy parameters)
  const reviewFilterParam = searchParams?.get('reviewFilter') as 'all' | 'correct' | 'incorrect' | null
  const incorrectOnlyParam = searchParams?.get('incorrectOnly') === 'true'
  
  // Determine effective review filter
  const reviewFilter = reviewFilterParam || (incorrectOnlyParam ? 'incorrect' : null)
  
  // Helper function to parse explanation sections
  const parseExplanation = (explanation: string) => {
    const sections: {
      correctAnswer?: string
      comprehensiveExplanation?: string
      realWorldExample?: string
      whyThisMatters?: string
      incorrectOptions?: { option: string; explanation: string }[]
    } = {}

    // Extract Correct Answer section
    const correctAnswerMatch = explanation.match(/✅ CORRECT ANSWER[^:]*:(.*?)(?=(?:COMPREHENSIVE EXPLANATION:|$))/is)
    if (correctAnswerMatch) {
      sections.correctAnswer = correctAnswerMatch[1].trim()
    }

    // Extract Comprehensive Explanation
    const comprehensiveMatch = explanation.match(/COMPREHENSIVE EXPLANATION:(.*?)(?=(?:REAL-WORLD EXAMPLE:|WHY THIS MATTERS:|❌ INCORRECT OPTIONS|$))/is)
    if (comprehensiveMatch) {
      sections.comprehensiveExplanation = comprehensiveMatch[1].trim()
    }

    // Extract Real-world Example
    const realWorldMatch = explanation.match(/REAL-WORLD EXAMPLE:(.*?)(?=(?:WHY THIS MATTERS:|❌ INCORRECT OPTIONS|$))/is)
    if (realWorldMatch) {
      sections.realWorldExample = realWorldMatch[1].trim()
    }

    // Extract Why This Matters
    const whyMattersMatch = explanation.match(/WHY THIS MATTERS:(.*?)(?=(?:❌ INCORRECT OPTIONS|$))/is)
    if (whyMattersMatch) {
      sections.whyThisMatters = whyMattersMatch[1].trim()
    }

    // Extract Incorrect Options
    const incorrectSectionMatch = explanation.match(/❌ INCORRECT OPTIONS.*?:(.*?)$/is)
    if (incorrectSectionMatch) {
      const incorrectText = incorrectSectionMatch[1]
      const options: { option: string; explanation: string }[] = []
      
      // Match Option A, B, C, D patterns
      const optionMatches = incorrectText.matchAll(/Option\s+([A-D]):(.*?)(?=(?:Option\s+[A-D]:|→|$))/gis)
      for (const match of optionMatches) {
        options.push({
          option: match[1],
          explanation: match[2].trim()
        })
      }
      
      sections.incorrectOptions = options
    }

    return sections
  }
  
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

  // Load user subscription status
  useEffect(() => {
    const loadSubscription = async () => {
      if (!user?.id) return
      
      try {
        const token = await getToken()
        const subscriptionData = await getUserSubscription(user.id, token)
        setSubscription(subscriptionData)
      } catch (error) {
        console.error('Failed to load subscription:', error)
        // Set default free subscription if fetch fails
        setSubscription({
          id: '',
          user_id: user.id,
          plan_type: 'free',
          status: 'active',
          polar_customer_id: null,
          polar_subscription_id: null,
          polar_product_id: null,
          current_period_start: null,
          current_period_end: null,
          cancel_at: null,
          canceled_at: null,
          started_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_paid: false
        })
      }
    }

    loadSubscription()
  }, [user?.id, getToken])

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
      
      // Track this question as reviewed
      if (reviewFilter && newQuestion.id) {
        const newReviewedSet = new Set(reviewedQuestions)
        newReviewedSet.add(newQuestion.id)
        setReviewedQuestions(newReviewedSet)
        
        // Check if review is complete
        if (totalReviewQuestions > 0 && newReviewedSet.size >= totalReviewQuestions) {
          setIsReviewComplete(true)
        }
      }
      
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

  // Load total review questions count when entering review mode
  useEffect(() => {
    const loadReviewCount = async () => {
      if (reviewFilter && user?.id) {
        try {
          const token = await getToken()
          const { getReviewCounts } = await import('@/lib/api')
          const counts = await getReviewCounts(user.id, token)
          
          // Set total based on filter type
          const total = reviewFilter === 'all' ? counts.total :
                       reviewFilter === 'correct' ? counts.correct :
                       counts.incorrect
          setTotalReviewQuestions(total)
        } catch (error) {
          console.error('Failed to load review count:', error)
        }
      }
    }
    
    loadReviewCount()
  }, [reviewFilter, user?.id, getToken])

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
              <div className="flex items-center justify-between gap-3">
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
                {totalReviewQuestions > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    Question {reviewedQuestions.size} of {totalReviewQuestions}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Review Complete State */}
        {isReviewComplete && reviewFilter && (
          <Card className="border-green-500 bg-green-50 dark:bg-green-950/30">
            <CardHeader>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-green-500 flex items-center justify-center">
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-2xl text-green-900 dark:text-green-100">
                    Review Complete!
                  </CardTitle>
                  <CardDescription className="mt-2 text-green-700 dark:text-green-200">
                    You've reviewed all {totalReviewQuestions} questions in this set
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => {
                    setReviewedQuestions(new Set())
                    setIsReviewComplete(false)
                    loadQuestion()
                  }}
                  className="flex-1 gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Start Over
                </Button>
                <Button 
                  asChild
                  variant="outline"
                  className="flex-1"
                >
                  <Link href="/study">
                    Back to Study Modes
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Domain Selector */}
        {!reviewFilter && !isReviewComplete && (
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
        {!isReviewComplete && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <Badge variant="default">Domain {question.domain}</Badge>
              </div>
              
              {/* Question Metadata */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {question.topic && (
                  <Badge variant="outline" className="gap-1">
                    <BookOpen className="h-3 w-3" />
                    {question.topic}
                  </Badge>
                )}
                
                {question.question_id && (
                  <Badge variant="secondary" className="ml-auto">
                    #{question.question_id}
                  </Badge>
                )}
              </div>
              
              <CardTitle className="text-xl leading-relaxed">
                {question.q_text}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Review Mode: Show previous answer */}
              {question.isReviewMode && question.userPreviousResponse ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Your Previous Answer:
                    </p>
                    <p className="text-lg font-semibold">
                      {question.userPreviousResponse.wasCorrect ? (
                        <span className="text-green-600 dark:text-green-400">
                          ✓ {question.userPreviousResponse.selectedChoice} (Correct)
                        </span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400">
                          ✗ {question.userPreviousResponse.selectedChoice} (Incorrect)
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {choices.map((choice) => {
                      const isUserChoice = choice.value === question.userPreviousResponse?.selectedChoice
                      const isCorrectAnswer = choice.value === question.answer
                      
                      return (
                        <div
                          key={choice.value}
                          className={`w-full p-4 rounded-lg border-2 ${
                            isCorrectAnswer
                              ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                              : isUserChoice && !question.userPreviousResponse?.wasCorrect
                              ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                              : "border-border bg-muted/30"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`flex-shrink-0 w-8 h-8 rounded-full font-semibold flex items-center justify-center ${
                                isCorrectAnswer
                                  ? "bg-green-500 text-white"
                                  : isUserChoice && !question.userPreviousResponse?.wasCorrect
                                  ? "bg-red-500 text-white"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {choice.value}
                            </span>
                            <span className="flex-1">{choice.text}</span>
                            {isCorrectAnswer && (
                              <span className="text-green-600 dark:text-green-400 font-semibold whitespace-nowrap">
                                ✓ Correct Answer
                              </span>
                            )}
                            {isUserChoice && !isCorrectAnswer && (
                              <span className="text-red-600 dark:text-red-400 font-semibold whitespace-nowrap">
                                Your Choice
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {question.explanation && (
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">Explanation:</h4>
                      <p className="text-sm text-muted-foreground">{question.explanation}</p>
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
              ) : !result ? (
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

                {result.explanation && (() => {
                  const sections = parseExplanation(result.explanation)
                  const isPaid = subscription?.is_paid || false

                  return (
                    <div className="space-y-4">
                      {/* Correct Answer - Always Visible */}
                      {sections.correctAnswer && (
                        <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                          <div className="flex items-start gap-2 mb-2">
                            <span className="text-green-600 text-xl">✅</span>
                            <h4 className="font-bold text-green-900 dark:text-green-100">CORRECT ANSWER</h4>
                          </div>
                          <p className="text-sm text-green-900 dark:text-green-100 leading-relaxed whitespace-pre-wrap">
                            {sections.correctAnswer}
                          </p>
                        </div>
                      )}

                      {/* Comprehensive Explanation - Always Visible */}
                      {sections.comprehensiveExplanation && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                          <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2">
                            COMPREHENSIVE EXPLANATION
                          </h4>
                          <p className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed whitespace-pre-wrap">
                            {sections.comprehensiveExplanation}
                          </p>
                        </div>
                      )}

                      {/* Premium Content - Paywalled for Free Users */}
                      {!isPaid && (sections.realWorldExample || sections.whyThisMatters || sections.incorrectOptions) && (
                        <div className="relative p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-2 border-purple-200 dark:border-purple-900 rounded-lg">
                          <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-sm rounded-lg flex items-center justify-center">
                            <div className="text-center space-y-4 p-6">
                              <div className="flex justify-center">
                                <Crown className="h-12 w-12 text-purple-600" />
                              </div>
                              <div>
                                <h4 className="font-bold text-lg mb-2">Upgrade to Premium</h4>
                                <p className="text-sm text-muted-foreground mb-4">
                                  Unlock detailed explanations including:
                                </p>
                                <ul className="text-sm text-left space-y-1 mb-4">
                                  <li className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-purple-600" />
                                    Real-world examples
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-purple-600" />
                                    Why this matters for your exam
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-purple-600" />
                                    Detailed breakdown of incorrect options
                                  </li>
                                </ul>
                                <Link href="/pricing">
                                  <Button className="w-full">
                                    <Crown className="h-4 w-4 mr-2" />
                                    Upgrade Now
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                          {/* Blurred preview */}
                          <div className="blur-sm">
                            <h4 className="font-bold mb-2">REAL-WORLD EXAMPLE</h4>
                            <p className="text-sm mb-4">Lorem ipsum dolor sit amet...</p>
                            <h4 className="font-bold mb-2">WHY THIS MATTERS</h4>
                            <p className="text-sm">Lorem ipsum dolor sit amet...</p>
                          </div>
                        </div>
                      )}

                      {/* Premium Content - Visible for Paid Users */}
                      {isPaid && (
                        <>
                          {sections.realWorldExample && (
                            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
                              <h4 className="font-bold text-amber-900 dark:text-amber-100 mb-2">
                                📚 REAL-WORLD EXAMPLE
                              </h4>
                              <p className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed whitespace-pre-wrap">
                                {sections.realWorldExample}
                              </p>
                            </div>
                          )}

                          {sections.whyThisMatters && (
                            <div className="p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 rounded-lg">
                              <h4 className="font-bold text-purple-900 dark:text-purple-100 mb-2">
                                💡 WHY THIS MATTERS
                              </h4>
                              <p className="text-sm text-purple-900 dark:text-purple-100 leading-relaxed whitespace-pre-wrap">
                                {sections.whyThisMatters}
                              </p>
                            </div>
                          )}

                          {sections.incorrectOptions && sections.incorrectOptions.length > 0 && (
                            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
                              <div className="flex items-start gap-2 mb-3">
                                <span className="text-red-600 text-xl">❌</span>
                                <h4 className="font-bold text-red-900 dark:text-red-100">
                                  INCORRECT OPTIONS - Why They're Wrong
                                </h4>
                              </div>
                              <div className="space-y-3">
                                {sections.incorrectOptions.map((item, idx) => (
                                  <div key={idx} className="pl-4 border-l-2 border-red-300 dark:border-red-800">
                                    <p className="font-semibold text-red-900 dark:text-red-100 mb-1">
                                      Option {item.option}:
                                    </p>
                                    <p className="text-sm text-red-900 dark:text-red-100 leading-relaxed">
                                      {item.explanation}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* Fallback for unparsed explanations */}
                      {!sections.correctAnswer && !sections.comprehensiveExplanation && (
                        <div className="p-4 bg-muted rounded-lg">
                          <h4 className="font-semibold mb-2">Explanation:</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{result.explanation}</p>
                        </div>
                      )}
                    </div>
                  )
                })()}

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
        )}

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
