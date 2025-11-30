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

      try {
        const res = await fetch(`/api/onboarding/status?userId=${user.id}`);
        const data = await res.json();

        // If onboarding not completed, redirect to onboarding
        if (!data.completed) {
          router.push('/onboarding');
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
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
