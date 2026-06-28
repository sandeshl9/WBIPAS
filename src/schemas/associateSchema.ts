/**
 * ASSOCIATE VALIDATION SCHEMA
 * 
 * Zod schema for associate form validation
 */

import { z } from 'zod'

export const associateSchema = z.object({
  employeeCode: z
    .string()
    .min(1, 'Employee code is required')
    .max(20, 'Employee code must be 20 characters or less')
    .regex(/^[A-Z0-9]+$/, 'Employee code must contain only uppercase letters and numbers'),

  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .regex(/^[a-zA-Z\s]+$/, 'Name must contain only letters and spaces'),

  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(255, 'Email must be 255 characters or less'),

  weeklyCapacity: z
    .number()
    .min(1, 'Weekly capacity must be at least 1')
    .max(100, 'Weekly capacity must not exceed 100')
    .int('Weekly capacity must be a whole number'),

  availabilityStatus: z.enum(['available', 'leave', 'training', 'holiday', 'inactive'], {
    required_error: 'Availability status is required',
  }),

  department: z
    .string()
    .max(100, 'Department must be 100 characters or less')
    .optional()
    .or(z.literal('')),

  designation: z
    .string()
    .max(100, 'Designation must be 100 characters or less')
    .optional()
    .or(z.literal('')),
})

export type AssociateFormValues = z.infer<typeof associateSchema>
