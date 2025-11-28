import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Tagline */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Certverse
          </h1>
          <p className="mt-2 text-muted-foreground">
            Master CISA. Pass with confidence.
          </p>
        </div>

        {/* Clerk Sign Up Component */}
        <div className="animate-fade-in">
          <SignUp
            forceRedirectUrl="/dashboard"
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-xl",
              },
            }}
          />
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          © 2025 Certverse. All rights reserved.
        </p>
      </div>
    </div>
  )
}
