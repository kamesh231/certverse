import { z } from 'zod';

/**
 * Validation schemas for API endpoints
 */

// Submit Answer Schema
export const submitAnswerSchema = z.object({
  questionId: z.string().uuid('Invalid question ID format'),
  selectedChoice: z.enum(['A', 'B', 'C', 'D'], {
    errorMap: () => ({ message: 'Choice must be A, B, C, or D' }),
  }),
  selectedAnswer: z.enum(['A', 'B', 'C', 'D']).optional(), // Support both field names
  selectedOption: z.enum(['A', 'B', 'C', 'D']).optional(), // Support alternative field name
}).refine(
  (data) => data.selectedChoice || data.selectedAnswer || data.selectedOption,
  {
    message: 'Either selectedChoice, selectedAnswer, or selectedOption is required',
  }
);

// Get Question Schema (query params)
export const getQuestionSchema = z.object({
  userEmail: z.string().email('Invalid email format'),
  domain: z.string().optional().transform((val) => {
    if (!val) return undefined;
    const num = parseInt(val, 10);
    return isNaN(num) || num < 1 || num > 5 ? undefined : num;
  }),
});

// Get User History Schema (query params)
export const getUserHistorySchema = z.object({
  limit: z.string().optional().transform((val) => {
    if (!val) return 10;
    const num = parseInt(val, 10);
    return isNaN(num) || num < 1 || num > 100 ? 10 : num;
  }),
});

// Create Checkout Schema
export const createCheckoutSchema = z.object({
  userEmail: z.string().email('Invalid email format'),
});

// Onboarding Schemas
export const saveGoalSchema = z.object({
  goal: z.string().min(1, 'Goal is required'),
  certification: z.string().optional(),
  experienceLevel: z.string().optional(),
  studyTime: z.string().optional(),
  examDate: z.string().optional(),
});

export const saveConfidenceSchema = z.object({
  ratings: z.array(
    z.object({
      topic: z.string(),
      confidence: z.number().min(1).max(5),
    })
  ),
  category: z.string(),
});

export const updateStepSchema = z.object({
  step: z.string().min(1, 'Step is required'),
  data: z.any().optional(),
});

export const updatePreferencesSchema = z.object({
  timezone: z.string().optional(),
  fullName: z.string().optional(),
});

export const markTipShownSchema = z.object({
  tipId: z.string().min(1, 'Tip ID is required'),
});

export const checkTipShownSchema = z.object({
  tipId: z.string().min(1, 'Tip ID is required'),
});

// No params schemas (userId comes from JWT)
export const noParamsSchema = z.object({});

