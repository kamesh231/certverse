"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from "next/link"
import { BookOpen, Clock, Target, ArrowLeft, RotateCcw } from "lucide-react"

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
  const [selectedDomain, setSelectedDomain] = useState<string>("all")

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

        <div className="grid gap-6 md:grid-cols-2">
          {/* Study Mode */}
          <Card>
            <CardHeader>
              <BookOpen className="h-8 w-8 text-blue-500 mb-2" />
              <CardTitle>Study Mode</CardTitle>
              <CardDescription>
                Learn and review questions at your own pace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/question">Start Studying</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Practice Mode with Domain Dropdown */}
          <Card>
            <CardHeader>
              <Target className="h-8 w-8 text-indigo-500 mb-2" />
              <CardTitle>Practice Mode</CardTitle>
              <CardDescription>
                Practice questions from specific domains
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Domain:</label>
                <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Domains" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Domains</SelectItem>
                    <SelectItem value="1">Domain 1: {domainShortNames[1]}</SelectItem>
                    <SelectItem value="2">Domain 2: {domainShortNames[2]}</SelectItem>
                    <SelectItem value="3">Domain 3: {domainShortNames[3]}</SelectItem>
                    <SelectItem value="4">Domain 4: {domainShortNames[4]}</SelectItem>
                    <SelectItem value="5">Domain 5: {domainShortNames[5]}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                asChild 
                className="w-full"
                disabled={!selectedDomain}
              >
                <Link href={selectedDomain === "all" ? "/question" : `/question?domain=${selectedDomain}`}>
                  Start Practicing
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Test Mode */}
          <Card>
            <CardHeader>
              <Clock className="h-8 w-8 text-purple-500 mb-2" />
              <CardTitle>Test Mode</CardTitle>
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

          {/* Revise Mode */}
          <Card>
            <CardHeader>
              <RotateCcw className="h-8 w-8 text-green-500 mb-2" />
              <CardTitle>Revise</CardTitle>
              <CardDescription>
                Review your incorrect answers and improve
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

