/**
 * VALIDATION - Associate Schema
 * 
 * Zod schemas for associate forms
 */

import { z } from 'zod'

export const createAssociateSchema = z.object({
  employeeId: z
    .string()
    .min(1, 'Employee ID is required')
    .max(50, 'Employee ID must be less than 50 characters')
    .regex(/^[A-Z0-9]+$/, 'Employee ID must contain only uppercase letters and numbers'),

  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),

  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),

  weeklyCapacity: z
    .number()
    .int('Weekly capacity must be a whole number')
    .min(1, 'Weekly capacity must be at least 1')
    .max(100, 'Weekly capacity cannot exceed 100'),

  department: z
    .string()
    .max(100, 'Department must be less than 100 characters')
    .optional(),

  skills: z.array(z.string()).optional(),
})

export const updateAssociateSchema = createAssociateSchema.partial()

export type CreateAssociateFormData = z.infer<typeof createAssociateSchema>
export type UpdateAssociateFormData = z.infer<typeof updateAssociateSchema>
