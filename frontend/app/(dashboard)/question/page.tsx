"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { QuestionCard } from "@/components/question-card"
import { fetchQuestion, submitAnswer, Question, SubmitAnswerResponse } from "@/lib/api"
import { Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function QuestionPage() {
  const { user } = useUser()
  const [question, setQuestion] = useState<Question | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadQuestion = async () => {
    if (!user?.id) return

    setIsLoading(true)
    setError(null)

    try {
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

    return await submitAnswer(user.id, question.id, choice)
  }

  const handleNext = () => {
    loadQuestion()
  }

  return (
    <div className="min-h-screen bg-background">

      <main className="container py-8">
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

        {!isLoading && !error && question && (
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
