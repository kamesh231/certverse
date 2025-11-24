"use client"

import Link from "next/link"
import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs"
import { ThemeToggle } from "./theme-toggle"
import { Award } from "lucide-react"

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 font-bold text-xl">
          <Award className="h-6 w-6 text-primary" />
          <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Certverse
          </span>
        </Link>

        {/* Navigation Links */}
        <SignedIn>
          <nav className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/study"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Study
            </Link>
            <Link
              href="/question"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Practice
            </Link>
            <Link
              href="/settings"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Settings
            </Link>
          </nav>
        </SignedIn>

        {/* Right side: Dark mode toggle + User button */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <SignedIn>
            <UserButton
              afterSignOutUrl="/sign-in"
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9",
                },
              }}
            />
          </SignedIn>
          <SignedOut>
            <Link
              href="/sign-in"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Sign In
            </Link>
          </SignedOut>
        </div>
      </div>
    </header>
  )
}
