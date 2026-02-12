import { z } from 'zod';

/**
 * Zod schemas for onboarding data validation.
 * Step 1 fields (childName, birthDate) are strictly required.
 * Steps 2-5 fields are optional until their respective steps.
 */

export const focusAreaSchema = z.enum(['homework', 'project', 'fitness', 'home']);
export const schoolFeatureSchema = z.enum(['school_quest', 'homework_hero', 'morning_pro', 'evening_routine', 'daily_dash', 'fuel_up', 'steam_startup']);

export const gradeSchema = z.enum([
  'preschool', 'kindergarten', '1', '2', '3', '4', '5', '6',
  '7', '8', '9', '10', '11', '12', 'other',
]);

// Step 1: Required — child name; birth date & grade are optional
export const step1Schema = z.object({
  childName: z
    .string()
    .trim()
    .min(1, { message: 'שם הילד/ה הוא שדה חובה' })
    .max(50, { message: 'השם ארוך מדי (עד 50 תווים)' }),
  birthDate: z
    .date()
    .refine(
      (date) => {
        const age = Math.floor(
          (Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
        );
        return age >= 3 && age <= 25;
      },
      { message: 'הגיל חייב להיות בין 3 ל-25' }
    )
    .optional()
    .nullable(),
  grade: gradeSchema.optional().nullable(),
});

// Full onboarding draft — partial for persistence, strict for final commit
export const onboardingDraftSchema = z.object({
  childName: z.string().optional(),
  birthDate: z.string().optional(), // ISO string in storage
  grade: gradeSchema.optional().nullable(),
  focusArea: focusAreaSchema.optional(),
  schoolFeature: schoolFeatureSchema.optional(),
  firstTask: z.string().max(100).optional(),
  weekendReward: z.string().max(100).optional(),
  lastCompletedStep: z.number().int().min(0).max(6),
  updatedAt: z.string(),
  childProfileId: z.string().uuid().optional(), // set after Step 1 commit
});

// Final completion validation (Step 6 submit)
export const onboardingCompleteSchema = z.object({
  childName: z.string().trim().min(1).max(50),
  birthDate: z.date(),
  focusArea: focusAreaSchema,
  schoolFeature: schoolFeatureSchema,
  firstTask: z.string().min(1).max(100),
  weekendReward: z.string().min(1).max(100),
});

export type OnboardingDraftZod = z.infer<typeof onboardingDraftSchema>;
export type Step1Data = z.infer<typeof step1Schema>;
export type OnboardingCompleteData = z.infer<typeof onboardingCompleteSchema>;
