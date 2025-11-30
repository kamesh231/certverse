'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import WelcomeStep from '@/components/onboarding/WelcomeStep';
import GoalStep from '@/components/onboarding/GoalStep';
import ConfidenceStep from '@/components/onboarding/ConfidenceStep';
import FirstQuestionStep from '@/components/onboarding/FirstQuestionStep';

// Temporarily skip first_question step until CISA questions are added
const STEPS = ['welcome', 'goal', 'confidence', 'completed'];

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [goalData, setGoalData] = useState<any>(null);

  useEffect(() => {
    if (user) {
      checkOnboardingStatus();
    }
  }, [user]);

  const checkOnboardingStatus = async () => {
    try {
      const res = await fetch(`/api/onboarding/status?userId=${user?.id}`);
      const data = await res.json();

      if (data.completed) {
        // Already completed, redirect to dashboard
        router.push('/dashboard');
      } else if (data.current_step) {
        // Resume from current step
        const stepIndex = STEPS.indexOf(data.current_step);
        setCurrentStepIndex(stepIndex >= 0 ? stepIndex : 0);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = (data?: any) => {
    if (data) {
      setGoalData(data);
    }

    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    try {
      await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      });

      router.push('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentStep = STEPS[currentStepIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStepIndex + 1} of {STEPS.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(((currentStepIndex + 1) / STEPS.length) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{
                width: `${((currentStepIndex + 1) / STEPS.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {currentStep === 'welcome' && <WelcomeStep onNext={handleNext} />}
          {currentStep === 'goal' && <GoalStep onNext={handleNext} />}
          {currentStep === 'confidence' && (
            <ConfidenceStep
              certification={goalData?.certification}
              onNext={handleNext}
            />
          )}
          {currentStep === 'first_question' && (
            <FirstQuestionStep onNext={completeOnboarding} />
          )}
        </div>
      </div>
    </div>
  );
}
