/**
 * ASSOCIATE FORM - Volume 6 Component
 * 
 * Reusable form for creating and editing associates
 */

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { associateSchema, AssociateFormValues } from '@/schemas/associateSchema'
import type { Associate } from '@/types/associate'

export interface AssociateFormProps {
  mode: 'create' | 'edit'
  initialData?: Associate
  onSubmit: (data: AssociateFormValues) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function AssociateForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}: AssociateFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<AssociateFormValues>({
    resolver: zodResolver(associateSchema),
    defaultValues: initialData
      ? {
          employeeCode: initialData.employeeCode,
          name: initialData.name,
          email: initialData.email,
          weeklyCapacity: initialData.weeklyCapacity,
          availabilityStatus: initialData.availabilityStatus,
          department: initialData.department || '',
          designation: initialData.designation || '',
        }
      : {
          employeeCode: '',
          name: '',
          email: '',
          weeklyCapacity: 5,
          availabilityStatus: 'available',
          department: '',
          designation: '',
        },
  })

  const availabilityStatus = watch('availabilityStatus')

  const handleFormSubmit = async (data: AssociateFormValues) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const availabilityOptions = [
    { value: 'available', label: 'Available' },
    { value: 'leave', label: 'On Leave' },
    { value: 'training', label: 'Training' },
    { value: 'holiday', label: 'Holiday' },
    { value: 'inactive', label: 'Inactive' },
  ]

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="ghost"
          icon={ArrowLeft}
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Back
        </Button>
        <div>
          <h1 className="text-page-title font-bold">
            {mode === 'create' ? 'Add Associate' : 'Edit Associate'}
          </h1>
          <p className="text-secondary mt-1">
            {mode === 'create'
              ? 'Add a new team member to the system'
              : 'Update associate information'}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="card p-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Employee Code */}
          <div>
            <Input
              label="Employee Code"
              placeholder="EMP001"
              required
              error={errors.employeeCode?.message}
              disabled={mode === 'edit' || isSubmitting}
              {...register('employeeCode')}
            />
            {mode === 'edit' && (
              <p className="text-xs text-muted-foreground mt-1">
                Employee code cannot be changed
              </p>
            )}
          </div>

          {/* Full Name */}
          <div>
            <Input
              label="Full Name"
              placeholder="John Doe"
              required
              error={errors.name?.message}
              disabled={isSubmitting}
              {...register('name')}
            />
          </div>

          {/* Email */}
          <div>
            <Input
              label="Email Address"
              type="email"
              placeholder="john.doe@company.com"
              required
              error={errors.email?.message}
              disabled={isSubmitting}
              {...register('email')}
            />
          </div>

          {/* Weekly Capacity */}
          <div>
            <Input
              label="Weekly Capacity"
              type="number"
              placeholder="5"
              required
              min={1}
              max={100}
              error={errors.weeklyCapacity?.message}
              disabled={isSubmitting}
              {...register('weeklyCapacity', { valueAsNumber: true })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Number of projects this associate can handle per week
            </p>
          </div>

          {/* Availability Status */}
          <div>
            <Select
              label="Availability Status"
              required
              options={availabilityOptions}
              value={availabilityStatus}
              onValueChange={(value) =>
                setValue('availabilityStatus', value as any)
              }
              error={errors.availabilityStatus?.message}
              disabled={isSubmitting}
            />
          </div>

          {/* Department */}
          <div>
            <Input
              label="Department"
              placeholder="Engineering"
              error={errors.department?.message}
              disabled={isSubmitting}
              {...register('department')}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Optional: Team or department name
            </p>
          </div>

          {/* Designation */}
          <div className="md:col-span-2">
            <Input
              label="Designation"
              placeholder="Senior Developer"
              error={errors.designation?.message}
              disabled={isSubmitting}
              {...register('designation')}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Optional: Job title or role
            </p>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-border">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={isSubmitting ? Loader2 : Save}
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            {mode === 'create' ? 'Create Associate' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Information Card */}
      <div className="card p-4 bg-info-50 dark:bg-info-900/20 border-info-200 dark:border-info-800">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-info-100 dark:bg-info-900/40">
              <svg
                className="h-5 w-5 text-info-600 dark:text-info-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-info-900 dark:text-info-100">
              Important Notes
            </h3>
            <div className="mt-2 text-sm text-info-700 dark:text-info-300">
              <ul className="list-disc list-inside space-y-1">
                <li>Employee code must be unique and cannot be changed after creation</li>
                <li>Email address must be unique across all associates</li>
                <li>Weekly capacity determines maximum project assignments</li>
                <li>Availability status affects recommendation eligibility</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
