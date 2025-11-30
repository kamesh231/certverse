import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

// Routes that can be accessed while signed out
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
])

// Onboarding route - requires auth but skips onboarding check
const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"])

// Routes that have no authentication information
const isIgnoredRoute = createRouteMatcher(["/api/webhook"])

export default clerkMiddleware((auth, request) => {
  // Skip authentication for ignored routes
  if (isIgnoredRoute(request)) {
    return
  }

  // Protect all routes except public routes
  if (!isPublicRoute(request)) {
    auth().protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}
