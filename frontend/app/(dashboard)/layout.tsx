'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { DashboardSidebar } from "@/components/dashboard-sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    async function checkOnboardingStatus() {
      if (!isLoaded || !user) return;

      // Skip onboarding check if already on onboarding page
      if (pathname?.includes('/onboarding')) {
        setCheckingOnboarding(false);
        return;
      }

      // Check if we just completed onboarding (within last 10 seconds)
      const justCompleted = sessionStorage.getItem('onboarding_just_completed') === 'true';
      const completedAt = parseInt(sessionStorage.getItem('onboarding_completed_at') || '0');
      const timeSinceCompletion = Date.now() - completedAt;
      const isRecentCompletion = justCompleted && timeSinceCompletion < 10000; // 10 seconds

      try {
        const res = await fetch(`/api/onboarding/status?userId=${user.id}`);
        const data = await res.json();

        // If onboarding not completed
        if (!data.completed) {
          // If we just completed onboarding, retry a few times (database might be updating)
          if (isRecentCompletion) {
            let retries = 0;
            const maxRetries = 5;
            const retryDelay = 500; // 500ms between retries

            const retryCheck = async () => {
              if (retries >= maxRetries) {
                // After max retries, clear flag and redirect to onboarding
                sessionStorage.removeItem('onboarding_just_completed');
                sessionStorage.removeItem('onboarding_completed_at');
                router.push('/onboarding');
                setCheckingOnboarding(false);
                return;
              }

              await new Promise(resolve => setTimeout(resolve, retryDelay));
              
              const retryRes = await fetch(`/api/onboarding/status?userId=${user.id}`);
              const retryData = await retryRes.json();

              if (retryData.completed) {
                // Success! Clear the flag
                sessionStorage.removeItem('onboarding_just_completed');
                sessionStorage.removeItem('onboarding_completed_at');
                setCheckingOnboarding(false);
              } else {
                retries++;
                retryCheck();
              }
            };

            retryCheck();
            return; // Don't set checkingOnboarding to false yet - retryCheck will handle it
          } else {
            // Normal case: onboarding not completed, redirect
            router.push('/onboarding');
            setCheckingOnboarding(false);
          }
        } else {
          // Onboarding is completed, clear any flags
          sessionStorage.removeItem('onboarding_just_completed');
          sessionStorage.removeItem('onboarding_completed_at');
          setCheckingOnboarding(false);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setCheckingOnboarding(false);
      }
    }

    checkOnboardingStatus();
  }, [user, isLoaded, router, pathname]);

  // Show loading while checking onboarding
  if (checkingOnboarding) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto lg:ml-64">
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
          {children}
        </div>
      </main>
    </div>
  )
}
