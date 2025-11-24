"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { Question, SubmitAnswerResponse } from "@/lib/api"
import { cn } from "@/lib/utils"

interface QuestionCardProps {
  question: Question
  onSubmit: (choice: "A" | "B" | "C" | "D") => Promise<SubmitAnswerResponse>
  onNext: () => void
}

export function QuestionCard({ question, onSubmit, onNext }: QuestionCardProps) {
  const [selectedChoice, setSelectedChoice] = useState<"A" | "B" | "C" | "D" | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<SubmitAnswerResponse | null>(null)

  const choices: Array<{ value: "A" | "B" | "C" | "D"; text: string }> = [
    { value: "A", text: question.choice_a },
    { value: "B", text: question.choice_b },
    { value: "C", text: question.choice_c },
    { value: "D", text: question.choice_d },
  ]

  const handleSubmit = async () => {
    if (!selectedChoice) return

    setIsSubmitting(true)
    try {
      const response = await onSubmit(selectedChoice)
      setResult(response)
    } catch (error) {
      console.error("Failed to submit answer:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNext = () => {
    setSelectedChoice(null)
    setResult(null)
    onNext()
  }

  return (
    <Card className="w-full max-w-3xl mx-auto animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <Badge variant="default">Domain {question.domain}</Badge>
        </div>
        <h2 className="text-xl font-semibold leading-relaxed">
          {question.q_text}
        </h2>
      </CardHeader>

      <CardContent className="space-y-4">
        <RadioGroup
          value={selectedChoice || ""}
          onValueChange={(value) => setSelectedChoice(value as "A" | "B" | "C" | "D")}
          disabled={!!result || isSubmitting}
          className="space-y-3"
        >
          {choices.map((choice) => (
            <label
              key={choice.value}
              className={cn(
                "flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                selectedChoice === choice.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-accent/50",
                result && "cursor-default",
                result && choice.value === result.correctAnswer && "border-green-500 bg-green-50 dark:bg-green-950/30",
                result && selectedChoice === choice.value && !result.correct && "border-red-500 bg-red-50 dark:bg-red-950/30"
              )}
            >
              <RadioGroupItem value={choice.value} className="mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{choice.value}.</span>
                  <span className="flex-1">{choice.text}</span>
                  {result && choice.value === result.correctAnswer && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                  {result && selectedChoice === choice.value && !result.correct && (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
              </div>
            </label>
          ))}
        </RadioGroup>

        {/* Feedback */}
        {result && (
          <div
            className={cn(
              "p-4 rounded-lg animate-fade-in",
              result.correct
                ? "bg-green-50 dark:bg-green-950/30 border-2 border-green-500"
                : "bg-red-50 dark:bg-red-950/30 border-2 border-red-500"
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              {result.correct ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-900 dark:text-green-100">
                    Correct!
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="font-semibold text-red-900 dark:text-red-100">
                    Incorrect
                  </span>
                </>
              )}
            </div>
            {!result.correct && (
              <p className="text-sm text-red-800 dark:text-red-200 mb-2">
                The correct answer is <strong>{result.correctAnswer}</strong>
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              {result.explanation}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter>
        {!result ? (
          <Button
            onClick={handleSubmit}
            disabled={!selectedChoice || isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Answer"
            )}
          </Button>
        ) : (
          <Button onClick={handleNext} className="w-full" size="lg" variant="default">
            Next Question →
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
