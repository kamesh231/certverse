"use client"

import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function ResultsPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('sessionId')

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Test Results</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Results Page</CardTitle>
            <CardDescription>
              Test session results will be displayed here once test sessions are implemented.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sessionId ? (
              <p className="text-muted-foreground">
                Session ID: {sessionId}
              </p>
            ) : (
              <p className="text-muted-foreground">
                No session ID provided. Complete a test session to view results.
              </p>
            )}
            <Button asChild className="mt-4">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

