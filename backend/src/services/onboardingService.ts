import { supabase } from '../lib/supabase';
import logger from '../lib/logger';

export interface OnboardingState {
  user_id: string;
  completed: boolean;
  current_step: string;
  started_at: string;
  completed_at?: string;
  primary_goal?: string;
  target_certification?: string;
  experience_level?: string;
  study_time_per_week?: number;
  target_exam_date?: string;
  confidence_ratings?: { [topic: string]: number }; // e.g., { "networking": 3, "security": 7 }
  steps_completed: string[];
}

export interface UserPreferences {
  user_id: string;
  daily_reminder_time: string;
  reminder_enabled: boolean;
  preferred_difficulty: string;
  questions_per_session: number;
  email_daily_reminder: boolean;
  email_streak_warning: boolean;
  email_weekly_report: boolean;
  email_marketing: boolean;
  show_hints: boolean;
  show_timer: boolean;
  dark_mode: boolean;
  focus_areas?: string[];
  skip_known_topics: boolean;
  timezone?: string;
}

// Get or create onboarding state for user
export async function getOnboardingState(userId: string): Promise<OnboardingState | null> {
  const { data, error } = await supabase
    .from('user_onboarding')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code === 'PGRST116') {
    // No onboarding record, create one
    return await createOnboardingState(userId);
  }

  if (error) {
    logger.error('Error getting onboarding state:', error);
    throw error;
  }

  return data;
}

// Create initial onboarding state
export async function createOnboardingState(userId: string): Promise<OnboardingState> {
  const { data, error } = await supabase
    .from('user_onboarding')
    .insert({
      user_id: userId,
      completed: false,
      current_step: 'welcome',
      confidence_ratings: {},
      steps_completed: [],
    })
    .select()
    .single();

  if (error) {
    logger.error('Error creating onboarding state:', error);
    throw error;
  }

  logger.info(`Created onboarding state for user ${userId}`);
  return data;
}

// Update onboarding step
export async function updateOnboardingStep(
  userId: string,
  step: string,
  data?: Partial<OnboardingState>
): Promise<void> {
  // Get current state
  const currentState = await getOnboardingState(userId);
  if (!currentState) {
    throw new Error('Onboarding state not found');
  }

  // Add step to completed steps if not already there
  const stepsCompleted = currentState.steps_completed || [];
  if (!stepsCompleted.includes(currentState.current_step)) {
    stepsCompleted.push(currentState.current_step);
  }

  const updateData: any = {
    current_step: step,
    steps_completed: stepsCompleted,
    updated_at: new Date().toISOString(),
    ...data,
  };

  // If moving to 'completed' step, mark as completed
  if (step === 'completed') {
    updateData.completed = true;
    updateData.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('user_onboarding')
    .update(updateData)
    .eq('user_id', userId);

  if (error) {
    logger.error('Error updating onboarding step:', error);
    throw error;
  }

  logger.info(`Updated onboarding step for user ${userId} to ${step}`);
}

// Save user goal selection
export async function saveUserGoal(
  userId: string,
  goal: string,
  certification?: string,
  experienceLevel?: string,
  studyTime?: number,
  examDate?: string
): Promise<void> {
  await updateOnboardingStep(userId, 'confidence', {
    primary_goal: goal,
    target_certification: certification,
    experience_level: experienceLevel,
    study_time_per_week: studyTime,
    target_exam_date: examDate,
  });
}

// Save confidence ratings for topics
export async function saveConfidenceRatings(
  userId: string,
  ratings: { [topic: string]: number }, // e.g., { "networking": 3, "security": 7 }
  category: string
): Promise<void> {
  // Save to user_onboarding as JSON
  await updateOnboardingStep(userId, 'first_question', {
    confidence_ratings: ratings,
  });

  // Also save to topic_confidence table for detailed tracking
  const entries = Object.entries(ratings).map(([topic, confidence]) => ({
    user_id: userId,
    topic,
    category,
    confidence_level: confidence,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('topic_confidence')
    .upsert(entries, {
      onConflict: 'user_id,topic,category',
    });

  if (error) {
    logger.error('Error saving topic confidence:', error);
    throw error;
  }

  logger.info(`Saved confidence ratings for user ${userId}: ${JSON.stringify(ratings)}`);
}

// Get topics to focus on based on confidence
export async function getWeakTopics(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('topic_confidence')
    .select('topic')
    .eq('user_id', userId)
    .lte('confidence_level', 5) // Low confidence (1-5)
    .order('confidence_level', { ascending: true });

  if (error) {
    logger.error('Error getting weak topics:', error);
    throw error;
  }

  return data?.map(d => d.topic) || [];
}

// Get recommended difficulty based on average confidence
export async function getRecommendedDifficulty(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('topic_confidence')
    .select('confidence_level')
    .eq('user_id', userId);

  if (error || !data || data.length === 0) {
    return 'medium'; // Default
  }

  const avgConfidence = data.reduce((sum, d) => sum + d.confidence_level, 0) / data.length;

  // Map confidence to difficulty
  if (avgConfidence <= 3) return 'easy';
  if (avgConfidence <= 6) return 'medium';
  if (avgConfidence <= 8) return 'hard';
  return 'mixed';
}

// Get or create user preferences
export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code === 'PGRST116') {
    // Create default preferences
    return await createDefaultPreferences(userId);
  }

  if (error) {
    logger.error('Error getting user preferences:', error);
    throw error;
  }

  return data;
}

// Create default preferences
async function createDefaultPreferences(userId: string): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from('user_preferences')
    .insert({
      user_id: userId,
      daily_reminder_time: '09:00:00',
      reminder_enabled: true,
      preferred_difficulty: 'medium',
      questions_per_session: 10,
      email_daily_reminder: true,
      email_streak_warning: true,
      email_weekly_report: true,
      email_marketing: false,
      show_hints: true,
      show_timer: false,
      dark_mode: false,
      skip_known_topics: false,
      timezone: 'America/New_York',
    })
    .select()
    .single();

  if (error) {
    logger.error('Error creating user preferences:', error);
    throw error;
  }

  return data;
}

// Update user preferences
export async function updateUserPreferences(
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<void> {
  const { error } = await supabase
    .from('user_preferences')
    .update({
      ...preferences,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    logger.error('Error updating user preferences:', error);
    throw error;
  }

  logger.info(`Updated preferences for user ${userId}`);
}

// Mark onboarding as completed
export async function completeOnboarding(userId: string): Promise<void> {
  await updateOnboardingStep(userId, 'completed');
  logger.info(`Onboarding completed for user ${userId}`);
}

// Check if user has completed onboarding
export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  const state = await getOnboardingState(userId);
  return state?.completed || false;
}

// Track shown onboarding tip
export async function markTipShown(userId: string, tipId: string): Promise<void> {
  const { error } = await supabase
    .from('onboarding_tips_shown')
    .upsert({
      user_id: userId,
      tip_id: tipId,
      shown_at: new Date().toISOString(),
      dismissed: false,
    }, {
      onConflict: 'user_id,tip_id',
      ignoreDuplicates: true,
    });

  if (error) {
    logger.error('Error marking tip as shown:', error);
  }
}

// Check if tip has been shown
export async function hasTipBeenShown(userId: string, tipId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('onboarding_tips_shown')
    .select('tip_id')
    .eq('user_id', userId)
    .eq('tip_id', tipId)
    .single();

  if (error && error.code === 'PGRST116') {
    return false; // Not shown yet
  }

  return !!data;
}
