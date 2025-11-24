"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Target, Timer, RotateCcw, ArrowRight, Sparkles, Brain, Clock, History } from "lucide-react"

// CISA domains
const domains = [
  { id: "1", name: "Information Systems Governance" },
  { id: "2", name: "Risk Management" },
  { id: "3", name: "Information Systems Acquisition" },
  { id: "4", name: "Information Systems Implementation" },
  { id: "5", name: "Information Systems Operations" },
]

const studyModes = [
  {
    id: "practice",
    title: "Practice Mode",
    description:
      "Random questions with no time pressure. Get instant feedback and detailed explanations after each question.",
    icon: BookOpen,
    accentIcon: Sparkles,
    features: ["No timer", "Instant feedback", "Random questions", "Learn at your pace"],
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50",
    hoverGradient: "hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-900/50 dark:hover:to-cyan-900/50",
  },
  {
    id: "domain",
    title: "Domain Focus",
    description:
      "Target specific CISA domains to strengthen weak areas. Select a domain and practice questions focused on that topic.",
    icon: Target,
    accentIcon: Brain,
    features: ["Choose your domain", "Targeted practice", "Track improvement", "Master each area"],
    gradient: "from-indigo-500 to-purple-500",
    bgGradient: "from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50",
    hoverGradient:
      "hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/50 dark:hover:to-purple-900/50",
    hasDomainSelect: true,
  },
  {
    id: "timed",
    title: "Timed Test",
    description:
      "Full exam simulation with 150 questions and 4-hour time limit. Experience the real CISA exam environment.",
    icon: Timer,
    accentIcon: Clock,
    features: ["150 questions", "4-hour timer", "Exam simulation", "Final score report"],
    gradient: "from-emerald-500 to-teal-500",
    bgGradient: "from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50",
    hoverGradient: "hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-900/50 dark:hover:to-teal-900/50",
    comingSoon: true,
  },
  {
    id: "review",
    title: "Review Mistakes",
    description:
      "Retry questions you previously answered incorrectly. Learn from your mistakes and improve your weak areas.",
    icon: RotateCcw,
    accentIcon: History,
    features: ["Previous errors", "Learn from mistakes", "Build confidence", "Track progress"],
    gradient: "from-orange-500 to-red-500",
    bgGradient: "from-orange-50 to-red-50 dark:from-orange-950/50 dark:to-red-950/50",
    hoverGradient: "hover:from-orange-100 hover:to-red-100 dark:hover:from-orange-900/50 dark:hover:to-red-900/50",
    comingSoon: true,
  },
]

export default function StudyPage() {
  const router = useRouter()
  const [selectedDomain, setSelectedDomain] = useState<string>("")

  const handleStart = (modeId: string) => {
    if (modeId === "domain") {
      if (!selectedDomain) {
        alert("Please select a domain first")
        return
      }
      // For now, just go to practice mode - domain filtering can be added later
      router.push("/question")
      return
    }

    if (modeId === "practice") {
      router.push("/question")
      return
    }

    // For other modes, show coming soon
    alert("This mode is coming soon!")
  }

  return (
    <div className="min-h-screen bg-background">

      <main className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-balance">Choose Your Study Mode</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground text-pretty">
            Select the perfect study mode for your learning style and exam preparation goals
          </p>
        </div>

        {/* Study Mode Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {studyModes.map((mode) => {
            const MainIcon = mode.icon
            const AccentIcon = mode.accentIcon

            return (
              <Card
                key={mode.id}
                className={`group relative overflow-hidden transition-all hover:shadow-xl ${mode.hoverGradient}`}
              >
                {/* Gradient accent bar at top */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${mode.gradient}`} />

                {mode.comingSoon && (
                  <div className="absolute top-6 right-4 z-10">
                    <span className="rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-3 py-1 text-xs font-semibold text-white shadow-md">
                      Coming Soon
                    </span>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="mb-4 flex items-start justify-between">
                    <div className={`rounded-xl bg-gradient-to-br ${mode.gradient} p-3`}>
                      <MainIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <AccentIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <CardTitle className="mb-2 text-2xl">{mode.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">{mode.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Features list */}
                  <div className="grid grid-cols-2 gap-2">
                    {mode.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <div className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${mode.gradient}`} />
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Domain selector for Domain Focus mode */}
                  {mode.hasDomainSelect && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Select Domain</label>
                      <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose a CISA domain" />
                        </SelectTrigger>
                        <SelectContent>
                          {domains.map((domain) => (
                            <SelectItem key={domain.id} value={domain.id}>
                              {domain.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Start button */}
                  <Button
                    onClick={() => handleStart(mode.id)}
                    className={`w-full bg-gradient-to-r ${mode.gradient} text-white transition-transform hover:scale-[1.02] active:scale-[0.98]`}
                    size="lg"
                    disabled={mode.comingSoon && mode.id !== "practice" && mode.id !== "domain"}
                  >
                    Start {mode.title}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Bottom info section */}
        <Card className="mt-8 border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <h3 className="mb-1 font-semibold text-blue-900 dark:text-blue-100">Not sure which mode to choose?</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Start with Practice Mode to build fundamentals, then move to Domain Focus for targeted improvement
              </p>
            </div>
            <Sparkles className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
