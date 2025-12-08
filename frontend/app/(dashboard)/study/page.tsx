"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { BookOpen, Clock, Target, ArrowLeft, CheckCircle2 } from "lucide-react"

const domainNames: Record<number, string> = {
  1: "Information Systems Governance",
  2: "IT Risk Management",
  3: "Information Systems Acquisition",
  4: "Information Systems Implementation",
  5: "Information Systems Operations",
}

const domainShortNames: Record<number, string> = {
  1: "Governance",
  2: "Risk Management",
  3: "Acquisition",
  4: "Implementation",
  5: "Operations",
}

export default function StudyPage() {
  const [selectedDomain, setSelectedDomain] = useState<number | null>(null)

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
          <h1 className="text-3xl font-bold tracking-tight mb-2">Study Modes</h1>
          <p className="text-muted-foreground">
            Choose your study mode to begin practicing
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <BookOpen className="h-8 w-8 text-blue-500 mb-2" />
              <CardTitle>Practice Mode</CardTitle>
              <CardDescription>
                Practice questions at your own pace from all domains
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/question">Start Practicing</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Target className="h-8 w-8 text-indigo-500 mb-2" />
              <CardTitle>Domain Focus</CardTitle>
              <CardDescription>
                Focus on specific CISA domains
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedDomain ? (
                <div className="space-y-3">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border-2 border-indigo-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">Selected Domain</p>
                        <p className="text-xs text-muted-foreground">{domainNames[selectedDomain]}</p>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                    </div>
                  </div>
                  <Button asChild className="w-full">
                    <Link href={`/question?domain=${selectedDomain}`}>
                      Start Practicing Domain {selectedDomain}
                    </Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setSelectedDomain(null)}
                  >
                    Change Domain
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium mb-3">Select a domain:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {[1, 2, 3, 4, 5].map((domain) => (
                      <Button
                        key={domain}
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => setSelectedDomain(domain)}
                      >
                        <Badge variant="secondary" className="mr-2">
                          {domain}
                        </Badge>
                        {domainShortNames[domain]}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="opacity-60">
            <CardHeader>
              <Clock className="h-8 w-8 text-purple-500 mb-2" />
              <CardTitle>Timed Test</CardTitle>
              <CardDescription>
                Simulate the full CISA exam experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button disabled className="w-full" variant="outline">
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

