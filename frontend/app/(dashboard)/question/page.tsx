"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useSearchParams } from "next/navigation"
import { QuestionCard } from "@/components/question-card"
import { CountdownTimer } from "@/components/countdown-timer"
import { fetchQuestion, submitAnswer, getRemainingQuestions, Question, SubmitAnswerResponse } from "@/lib/api"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const domainNames: Record<number, string> = {
  1: "Information Systems Governance",
  2: "IT Risk Management",
  3: "Information Systems Acquisition",
  4: "Information Systems Implementation",
  5: "Information Systems Operations",
}

export default function QuestionPage() {
  const { user } = useUser()
  const searchParams = useSearchParams()
  const domainParam = searchParams.get('domain')
  const selectedDomain = domainParam ? parseInt(domainParam, 10) : undefined
  
  const [question, setQuestion] = useState<Question | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resetsAt, setResetsAt] = useState<string | null>(null)
  const [isLimitReached, setIsLimitReached] = useState(false)

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
      const userEmail = user.primaryEmailAddress.emailAddress
      // Validate domain if provided
      const domain = selectedDomain && selectedDomain >= 1 && selectedDomain <= 5 
        ? selectedDomain 
        : undefined
      
      const newQuestion = await fetchQuestion(user.id, userEmail, domain)
      setQuestion(newQuestion)
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
            const unlockStatus = await getRemainingQuestions(user.id)
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
  }, [user?.id, selectedDomain])

  const handleSubmit = async (choice: "A" | "B" | "C" | "D"): Promise<SubmitAnswerResponse> => {
    if (!user?.id || !question) {
      throw new Error("User or question not available")
    }

    const response = await submitAnswer(user.id, question.id, choice)
    return response
  }

  const handleNext = () => {
    loadQuestion()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading question...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <p className="text-destructive">{error}</p>
          {isLimitReached && resetsAt && (
            <CountdownTimer 
              targetDate={resetsAt} 
              onComplete={() => {
                // Reload question when timer completes
                setError(null)
                setIsLimitReached(false)
                loadQuestion()
              }}
            />
          )}
          <Button onClick={loadQuestion}>Try Again</Button>
        </div>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-muted-foreground">No question available</p>
          <Button onClick={loadQuestion}>Load Question</Button>
        </div>
      </div>
    )
  }

  const userEmail = user?.primaryEmailAddress?.emailAddress || ""

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-4xl">
        {selectedDomain && (
          <div className="mb-4 flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              Domain Focus: {domainNames[selectedDomain]}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.location.href = '/question'}
            >
              Clear Filter
            </Button>
          </div>
        )}
        <QuestionCard
          question={question}
          onSubmit={handleSubmit}
          onNext={handleNext}
          userEmail={userEmail}
        />
      </div>
    </div>
  )
}

