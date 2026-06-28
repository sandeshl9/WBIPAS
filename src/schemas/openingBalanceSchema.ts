/**
 * OPENING BALANCE VALIDATION SCHEMA
 * 
 * Zod schema for opening balance form validation
 */

import { z } from 'zod'

export const openingBalanceSchema = z.object({
  projectId: z
    .string()
    .min(1, 'Project ID is required')
    .max(50, 'Project ID must be 50 characters or less'),

  projectName: z
    .string()
    .min(1, 'Project name is required')
    .max(200, 'Project name must be 200 characters or less'),

  associateId: z
    .string()
    .min(1, 'Associate is required'),

  projectDate: z
    .string()
    .min(1, 'Project date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),

  weekNumber: z
    .number()
    .optional(),

  year: z
    .number()
    .optional(),

  status: z.enum(['pending', 'assigned', 'in_progress', 'on_hold'], {
    required_error: 'Status is required',
  }),
})

export type OpeningBalanceFormValues = z.infer<typeof openingBalanceSchema>
