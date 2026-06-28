/**
 * VALIDATION - Settings Schema
 * 
 * Zod schemas for settings forms
 */

import { z } from 'zod'

export const settingsSchema = z.object({
  organizationName: z
    .string()
    .min(1, 'Organization name is required')
    .max(200, 'Organization name must be less than 200 characters'),

  weekStartDay: z
    .number()
    .int('Week start day must be a whole number')
    .min(0, 'Week start day must be between 0 (Sunday) and 6 (Saturday)')
    .max(6, 'Week start day must be between 0 (Sunday) and 6 (Saturday)'),

  defaultWeeklyCapacity: z
    .number()
    .int('Default capacity must be a whole number')
    .min(1, 'Default capacity must be at least 1')
    .max(100, 'Default capacity cannot exceed 100'),

  theme: z.enum(['light', 'dark', 'system'], {
    errorMap: () => ({ message: 'Theme must be light, dark, or system' }),
  }),

  enableAiRecommendations: z.boolean(),
  enableEmailNotifications: z.boolean(),
})

export type SettingsFormData = z.infer<typeof settingsSchema>
