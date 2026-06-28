/**
 * MANUAL ENTRY - Opening Balance Component
 * 
 * Manually add opening balance projects one at a time
 */

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { openingBalanceSchema, OpeningBalanceFormValues } from '@/schemas/openingBalanceSchema'
import { getWeekNumber } from '@/utils/dateUtils'

export interface ManualEntryProps {
  associates: Array<{ id: string; name: string }>
  onSubmit: (data: OpeningBalanceFormValues) => Promise<void>
  loading?: boolean
}

export function ManualEntry({ associates, onSubmit, loading = false }: ManualEntryProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<OpeningBalanceFormValues>({
    resolver: zodResolver(openingBalanceSchema),
    defaultValues: {
      projectId: '',
      projectName: '',
      associateId: '',
      projectDate: '',
      status: 'assigned',
    },
  })

  const projectDate = watch('projectDate')
  const associateId = watch('associateId')

  // Calculate week number from date
  React.useEffect(() => {
    if (projectDate) {
      const date = new Date(projectDate)
      const { week, year } = getWeekNumber(date)
      setValue('weekNumber', week)
      setValue('year', year)
    }
  }, [projectDate, setValue])

  const handleFormSubmit = async (data: OpeningBalanceFormValues) => {
    try {
      await onSubmit(data)
      reset()
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'on_hold', label: 'On Hold' },
  ]

  return (
    <div className="space-y-6">
      {/* Information Banner */}
      <div className="card p-4 bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-primary-600 dark:text-primary-400"
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
          <div className="text-sm text-primary-700 dark:text-primary-300">
            <p className="font-medium">Opening Balance</p>
            <p className="mt-1">
              Import existing active projects to initialize workload tracking. These projects will
              immediately affect associate capacity and recommendations.
            </p>
          </div>
        </div>
      </div>

      {/* Manual Entry Form */}
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="card p-6">
          <h3 className="text-card-title font-semibold mb-4">Add Project Manually</h3>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Project ID */}
            <div>
              <Input
                label="Project ID"
                placeholder="PROJ-001"
                required
                error={errors.projectId?.message}
                disabled={isSubmitting}
                {...register('projectId')}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Unique identifier for this project
              </p>
            </div>

            {/* Project Name */}
            <div>
              <Input
                label="Project Name"
                placeholder="Website Redesign"
                required
                error={errors.projectName?.message}
                disabled={isSubmitting}
                {...register('projectName')}
              />
            </div>

            {/* Associate */}
            <div>
              <Select
                label="Assigned Associate"
                required
                placeholder="Select associate..."
                options={associates.map((a) => ({ value: a.id, label: a.name }))}
                value={associateId}
                onValueChange={(value) => setValue('associateId', value)}
                error={errors.associateId?.message}
                disabled={isSubmitting || loading}
              />
            </div>

            {/* Project Date */}
            <div>
              <Input
                label="Project Date"
                type="date"
                required
                error={errors.projectDate?.message}
                disabled={isSubmitting}
                {...register('projectDate')}
              />
              {projectDate && (
                <div className="flex gap-2 mt-2">
                  <Badge variant="info" size="sm">
                    Week {watch('weekNumber')}
                  </Badge>
                  <Badge variant="neutral" size="sm">
                    {watch('year')}
                  </Badge>
                </div>
              )}
            </div>

            {/* Status */}
            <div>
              <Select
                label="Project Status"
                required
                options={statusOptions}
                value={watch('status')}
                onValueChange={(value) => setValue('status', value as any)}
                error={errors.status?.message}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Only active statuses (not completed/cancelled)
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-border">
            <Button
              type="submit"
              variant="primary"
              icon={isSubmitting ? Loader2 : Plus}
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              Add Project
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
