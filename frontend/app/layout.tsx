import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { CookieConsent } from "@/components/cookie-consent"
import { AnalyticsProvider } from "@/components/analytics-provider"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Certverse - Master CISA. Pass with confidence.",
  description: "CISA exam preparation platform with AI-powered explanations",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <CookieConsent />
            <AnalyticsProvider />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
