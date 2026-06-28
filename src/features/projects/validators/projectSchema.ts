/**
 * VALIDATION - Project Schema
 * 
 * Zod schemas for project forms
 */

import { z } from 'zod'

export const createProjectSchema = z.object({
  projectId: z
    .string()
    .min(1, 'Project ID is required')
    .max(50, 'Project ID must be less than 50 characters')
    .regex(/^[A-Z0-9-]+$/, 'Project ID must contain only uppercase letters, numbers, and hyphens'),

  projectName: z
    .string()
    .min(3, 'Project name must be at least 3 characters')
    .max(200, 'Project name must be less than 200 characters'),

  client: z
    .string()
    .min(2, 'Client name must be at least 2 characters')
    .max(200, 'Client name must be less than 200 characters'),

  projectDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .refine((date) => {
      const d = new Date(date)
      return !isNaN(d.getTime())
    }, 'Invalid date'),

  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    errorMap: () => ({ message: 'Priority must be low, medium, high, or urgent' }),
  }),

  comments: z
    .string()
    .max(1000, 'Comments must be less than 1000 characters')
    .optional(),
})

export const updateProjectSchema = createProjectSchema.partial()

export type CreateProjectFormData = z.infer<typeof createProjectSchema>
export type UpdateProjectFormData = z.infer<typeof updateProjectSchema>
