import { Request, Response } from 'express';
import {
  getOnboardingState,
  createOnboardingState,
  updateOnboardingStep,
  saveUserGoal,
  saveConfidenceRatings,
  getWeakTopics,
  getRecommendedDifficulty,
  getUserPreferences,
  updateUserPreferences,
  completeOnboarding,
  hasCompletedOnboarding,
  markTipShown,
  hasTipBeenShown,
} from '../services/onboardingService';
import logger from '../lib/logger';

// GET /api/onboarding/status
export async function getOnboardingStatus(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).userId; // From verified JWT

    const state = await getOnboardingState(userId);
    const completed = await hasCompletedOnboarding(userId);

    res.json({
      ...state,
      completed,
    });
  } catch (error) {
    logger.error('Error getting onboarding status:', error);
    res.status(500).json({ error: 'Failed to get onboarding status' });
  }
}

// POST /api/onboarding/start
export async function startOnboarding(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).userId; // From verified JWT

    const state = await createOnboardingState(userId);

    res.json({
      success: true,
      state,
    });
  } catch (error) {
    logger.error('Error starting onboarding:', error);
    res.status(500).json({ error: 'Failed to start onboarding' });
  }
}

// POST /api/onboarding/goal
export async function saveGoal(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).userId; // From verified JWT
    const {
      goal,
      certification,
      experienceLevel,
      studyTime,
      examDate,
    } = req.body;

    if (!goal) {
      res.status(400).json({ error: 'goal is required' });
      return;
    }

    await saveUserGoal(
      userId,
      goal,
      certification,
      experienceLevel,
      studyTime,
      examDate
    );

    res.json({ success: true });
  } catch (error) {
    logger.error('Error saving user goal:', error);
    res.status(500).json({ error: 'Failed to save goal' });
  }
}

// POST /api/onboarding/confidence
export async function saveConfidence(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).userId; // From verified JWT
    const { ratings, category } = req.body;

    if (!ratings || !category) {
      res.status(400).json({ error: 'ratings and category are required' });
      return;
    }

    await saveConfidenceRatings(userId, ratings, category);

    res.json({ success: true });
  } catch (error) {
    logger.error('Error saving confidence ratings:', error);
    res.status(500).json({ error: 'Failed to save confidence ratings' });
  }
}

// GET /api/onboarding/weak-topics
export async function getWeakTopicsEndpoint(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).userId; // From verified JWT

    const weakTopics = await getWeakTopics(userId);

    res.json({ weakTopics });
  } catch (error) {
    logger.error('Error getting weak topics:', error);
    res.status(500).json({ error: 'Failed to get weak topics' });
  }
}

// GET /api/onboarding/recommended-difficulty
export async function getRecommendedDifficultyEndpoint(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).userId; // From verified JWT

    const difficulty = await getRecommendedDifficulty(userId);

    res.json({ difficulty });
  } catch (error) {
    logger.error('Error getting recommended difficulty:', error);
    res.status(500).json({ error: 'Failed to get recommended difficulty' });
  }
}

// POST /api/onboarding/step
export async function updateStep(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).userId; // From verified JWT
    const { step, data } = req.body;

    if (!step) {
      res.status(400).json({ error: 'step is required' });
      return;
    }

    await updateOnboardingStep(userId, step, data);

    res.json({ success: true });
  } catch (error) {
    logger.error('Error updating onboarding step:', error);
    res.status(500).json({ error: 'Failed to update step' });
  }
}

// POST /api/onboarding/complete
export async function finishOnboarding(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).userId; // From verified JWT
    await completeOnboarding(userId);

    res.json({ success: true });
  } catch (error) {
    logger.error('Error completing onboarding:', error);
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
}

// GET /api/onboarding/preferences
export async function getPreferences(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).userId; // From verified JWT

    const preferences = await getUserPreferences(userId);

    res.json(preferences);
  } catch (error) {
    logger.error('Error getting user preferences:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
}

// PUT /api/onboarding/preferences
export async function updatePreferences(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).userId; // From verified JWT
    const preferences = req.body;
    await updateUserPreferences(userId, preferences);

    res.json({ success: true });
  } catch (error) {
    logger.error('Error updating user preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
}

// POST /api/onboarding/tip/shown
export async function markTipAsShown(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).userId; // From verified JWT
    const { tipId } = req.body;

    if (!tipId) {
      res.status(400).json({ error: 'tipId is required' });
      return;
    }

    await markTipShown(userId, tipId);

    res.json({ success: true });
  } catch (error) {
    logger.error('Error marking tip as shown:', error);
    res.status(500).json({ error: 'Failed to mark tip' });
  }
}

// GET /api/onboarding/tip/check
export async function checkTipShown(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).userId; // From verified JWT
    const tipId = req.query.tipId as string;

    if (!tipId) {
      res.status(400).json({ error: 'tipId is required' });
      return;
    }

    const shown = await hasTipBeenShown(userId, tipId);

    res.json({ shown });
  } catch (error) {
    logger.error('Error checking tip status:', error);
    res.status(500).json({ error: 'Failed to check tip status' });
  }
}
