/**
 * PROJECT ASSIGNMENT WIZARD - Volume 6 Enhanced Flow
 * 
 * Guided 4-step wizard for project creation and assignment
 * Inspired by: Jira, Linear, Monday.com
 * 
 * Flow: Project Info → Recommendation → Confirmation → Success
 * 
 * Why this is better than the old flow:
 * - Less context switching
 * - Clear progression
 * - Easier validation
 * - Better mobile experience
 * - Feels like modern project management tools
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  FileText,
  Users,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Calendar,
  Briefcase,
  AlertCircle,
  Sparkles,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { RecommendationCard, NoRecommendationCard } from '@/components/recommendation/RecommendationCard'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { getWeekNumber, getYear } from '@/lib/utils'
import type { RecommendationResult, RankedRecommendation } from '@/recommendation-engine'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const projectInfoSchema = z.object({
  projectName: z.string().min(3, 'Project name must be at least 3 characters'),
  client: z.string().min(2, 'Client name must be at least 2 characters'),
  projectDate: z.string().refine((date) => new Date(date) >= new Date(new Date().setHours(0, 0, 0, 0)), {
    message: 'Project date cannot be in the past',
  }),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  comments: z.string().optional(),
})

type ProjectInfoData = z.infer<typeof projectInfoSchema>

// ============================================================================
// WIZARD STEPS
// ============================================================================

type WizardStep = 'info' | 'recommendation' | 'confirmation' | 'success'

interface WizardState {
  currentStep: WizardStep
  projectInfo: ProjectInfoData | null
  recommendation: RecommendationResult | null
  topCandidates: RankedRecommendation[]
  assignmentId: string | null
  overrideAssociate: { id: string; name: string } | null
  overrideReason: string
}

// ============================================================================
// PROPS
// ============================================================================

export interface ProjectAssignmentWizardProps {
  isOpen: boolean
  onClose: () => void
  onComplete?: (projectId: string) => void
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProjectAssignmentWizard({
  isOpen,
  onClose,
  onComplete,
}: ProjectAssignmentWizardProps) {
  const [state, setState] = useState<WizardState>({
    currentStep: 'info',
    projectInfo: null,
    recommendation: null,
    topCandidates: [],
    assignmentId: null,
    overrideAssociate: null,
    overrideReason: '',
  })

  const [isLoading, setIsLoading] = useState(false)

  // Form for Step 1
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ProjectInfoData>({
    resolver: zodResolver(projectInfoSchema),
    defaultValues: {
      priority: 'medium',
    },
  })

  const selectedDate = watch('projectDate')

  // ============================================================================
  // STEP HANDLERS
  // ============================================================================

  const handleProjectInfoSubmit = async (data: ProjectInfoData) => {
    setIsLoading(true)
    try {
      // Save project info
      setState((prev) => ({
        ...prev,
        projectInfo: data,
      }))

      // Fetch recommendation
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call

      // Mock recommendation data
      const mockRecommendation: RecommendationResult = {
        associate: {
          id: '1',
          name: 'Rahul Sharma',
          email: 'rahul@example.com',
          weeklyCapacity: 8,
          isActive: true,
          availabilityStatus: 'available',
        },
        explanation: {
          reasons: [
            'Weekly capacity available (3/8 projects)',
            'Lowest active workload (5 total projects)',
            'FIFO tie-breaker applied',
            'Oldest active project: Jan 15, 2024',
          ],
          workload: 5,
          capacity: 8,
          remainingCapacity: 3,
          fifoDate: new Date('2024-01-15'),
        },
        explanationText: 'Recommended based on capacity and workload',
        workloadBefore: 5,
        workloadAfter: 6,
        reason: 'fifo',
        engineVersion: '2.0.0',
      }

      const mockTopCandidates: RankedRecommendation[] = [
        { ...mockRecommendation, rank: 1, score: 95 },
        {
          ...mockRecommendation,
          rank: 2,
          score: 88,
          associate: { ...mockRecommendation.associate, id: '2', name: 'Amit Kumar', email: 'amit@example.com' },
          workloadBefore: 5,
        },
        {
          ...mockRecommendation,
          rank: 3,
          score: 82,
          associate: { ...mockRecommendation.associate, id: '3', name: 'Neha Patel', email: 'neha@example.com' },
          workloadBefore: 6,
        },
      ]

      setState((prev) => ({
        ...prev,
        recommendation: mockRecommendation,
        topCandidates: mockTopCandidates,
        currentStep: 'recommendation',
      }))
    } catch (error) {
      console.error('Failed to get recommendation:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptRecommendation = () => {
    setState((prev) => ({
      ...prev,
      currentStep: 'confirmation',
    }))
  }

  const handleOverride = (associateId: string, associateName: string, reason: string) => {
    setState((prev) => ({
      ...prev,
      overrideAssociate: { id: associateId, name: associateName },
      overrideReason: reason,
      currentStep: 'confirmation',
    }))
  }

  const handleConfirmAssignment = async () => {
    setIsLoading(true)
    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setState((prev) => ({
        ...prev,
        assignmentId: 'PROJ-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        currentStep: 'success',
      }))
    } catch (error) {
      console.error('Failed to create assignment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setState({
      currentStep: 'info',
      projectInfo: null,
      recommendation: null,
      topCandidates: [],
      assignmentId: null,
      overrideAssociate: null,
      overrideReason: '',
    })
  }

  const handleBack = () => {
    const stepOrder: WizardStep[] = ['info', 'recommendation', 'confirmation', 'success']
    const currentIndex = stepOrder.indexOf(state.currentStep)
    if (currentIndex > 0) {
      setState((prev) => ({
        ...prev,
        currentStep: stepOrder[currentIndex - 1],
      }))
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isOpen) return null

  const weekNumber = selectedDate ? getWeekNumber(new Date(selectedDate)) : null
  const year = selectedDate ? getYear(new Date(selectedDate)) : null

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-dialog bg-card shadow-soft-lg"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur-sm px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {state.currentStep === 'info' && 'New Project'}
                {state.currentStep === 'recommendation' && 'Recommended Associate'}
                {state.currentStep === 'confirmation' && 'Confirm Assignment'}
                {state.currentStep === 'success' && 'Assignment Complete'}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {state.currentStep === 'info' && 'Enter project details to get a recommendation'}
                {state.currentStep === 'recommendation' && 'Review the recommended associate'}
                {state.currentStep === 'confirmation' && 'Review and confirm the assignment'}
                {state.currentStep === 'success' && 'Project has been created and assigned'}
              </p>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              icon={X}
              aria-label="Close wizard"
            />
          </div>

          {/* Progress Steps */}
          <div className="mt-4 flex items-center gap-2">
            {[
              { step: 'info', label: 'Project Info', icon: FileText },
              { step: 'recommendation', label: 'Recommendation', icon: Users },
              { step: 'confirmation', label: 'Confirmation', icon: CheckCircle2 },
              { step: 'success', label: 'Complete', icon: Sparkles },
            ].map((item, index) => {
              const stepOrder: WizardStep[] = ['info', 'recommendation', 'confirmation', 'success']
              const currentIndex = stepOrder.indexOf(state.currentStep)
              const itemIndex = stepOrder.indexOf(item.step as WizardStep)
              const isActive = item.step === state.currentStep
              const isComplete = itemIndex < currentIndex

              return (
                <React.Fragment key={item.step}>
                  <div
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-3 py-2 transition-all',
                      isActive && 'bg-primary-100 dark:bg-primary-900/30',
                      isComplete && 'bg-success-50 dark:bg-success-900/20'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'h-4 w-4',
                        isActive && 'text-primary-600 dark:text-primary-400',
                        isComplete && 'text-success-600',
                        !isActive && !isComplete && 'text-muted-foreground'
                      )}
                    />
                    <span
                      className={cn(
                        'text-sm font-medium',
                        isActive && 'text-primary-900 dark:text-primary-100',
                        isComplete && 'text-success-700 dark:text-success-300',
                        !isActive && !isComplete && 'text-muted-foreground'
                      )}
                    >
                      {item.label}
                    </span>
                    {isComplete && (
                      <CheckCircle2 className="h-4 w-4 text-success-600" />
                    )}
                  </div>
                  {index < 3 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          <AnimatePresence mode="wait">
            {/* STEP 1: Project Information */}
            {state.currentStep === 'info' && (
              <motion.div
                key="info"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <form onSubmit={handleSubmit(handleProjectInfoSubmit)} className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <Input
                      label="Project Name"
                      placeholder="Enter project name"
                      {...register('projectName')}
                      error={errors.projectName?.message}
                      required
                    />

                    <Input
                      label="Client Name"
                      placeholder="Enter client name"
                      {...register('client')}
                      error={errors.client?.message}
                      required
                    />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <Input
                        type="date"
                        label="Project Date"
                        {...register('projectDate')}
                        error={errors.projectDate?.message}
                        required
                        icon={Calendar}
                      />
                      {weekNumber && year && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          Week {weekNumber}, {year}
                        </p>
                      )}
                    </div>

                    <Select
                      label="Priority"
                      {...register('priority')}
                      options={[
                        { value: 'low', label: 'Low' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'high', label: 'High' },
                        { value: 'urgent', label: 'Urgent' },
                      ]}
                      required
                    />
                  </div>

                  <Textarea
                    label="Comments"
                    placeholder="Add any additional notes or requirements"
                    {...register('comments')}
                    error={errors.comments?.message}
                  />

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      onClick={onClose}
                      variant="ghost"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      icon={ArrowRight}
                      iconPosition="right"
                      loading={isLoading}
                    >
                      Get Recommendation
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* STEP 2: Recommendation */}
            {state.currentStep === 'recommendation' && (
              <motion.div
                key="recommendation"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {state.recommendation ? (
                  <RecommendationCard
                    recommendation={state.recommendation}
                    topCandidates={state.topCandidates}
                    onAssign={handleAcceptRecommendation}
                    onOverride={() => {
                      // TODO: Open override dialog
                      console.log('Override requested')
                    }}
                  />
                ) : (
                  <NoRecommendationCard
                    reason="No eligible associates found with available capacity"
                    onAction={() => console.log('View all associates')}
                  />
                )}

                <div className="flex justify-between pt-4">
                  <Button
                    onClick={handleBack}
                    variant="ghost"
                    icon={ArrowLeft}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleAcceptRecommendation}
                    icon={ArrowRight}
                    iconPosition="right"
                    disabled={!state.recommendation}
                  >
                    Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Confirmation */}
            {state.currentStep === 'confirmation' && (
              <motion.div
                key="confirmation"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="card p-6">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                    <Briefcase className="h-5 w-5 text-primary-600" />
                    Assignment Summary
                  </h3>

                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Project Name</p>
                        <p className="mt-1 font-medium text-foreground">
                          {state.projectInfo?.projectName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Client</p>
                        <p className="mt-1 font-medium text-foreground">
                          {state.projectInfo?.client}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Project Date</p>
                        <p className="mt-1 font-medium text-foreground">
                          {state.projectInfo?.projectDate &&
                            new Date(state.projectInfo.projectDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Priority</p>
                        <p className="mt-1">
                          <Badge variant={state.projectInfo?.priority === 'urgent' ? 'error' : 'info'}>
                            {state.projectInfo?.priority}
                          </Badge>
                        </p>
                      </div>
                    </div>

                    {state.projectInfo?.comments && (
                      <div>
                        <p className="text-sm text-muted-foreground">Comments</p>
                        <p className="mt-1 text-sm text-foreground">
                          {state.projectInfo.comments}
                        </p>
                      </div>
                    )}

                    <div className="border-t border-border pt-4">
                      <p className="text-sm text-muted-foreground">Assigned To</p>
                      <p className="mt-1 text-lg font-semibold text-primary-600">
                        {state.overrideAssociate?.name ||
                          state.recommendation?.associate.name}
                      </p>
                      {state.overrideAssociate && (
                        <div className="mt-2 rounded-lg bg-warning-50 dark:bg-warning-900/10 px-3 py-2">
                          <p className="flex items-center gap-2 text-sm text-warning-900 dark:text-warning-100">
                            <AlertCircle className="h-4 w-4" />
                            Manager Override: {state.overrideReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    onClick={handleBack}
                    variant="ghost"
                    icon={ArrowLeft}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleConfirmAssignment}
                    icon={CheckCircle2}
                    iconPosition="right"
                    loading={isLoading}
                  >
                    Confirm Assignment
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Success */}
            {state.currentStep === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="mb-6 flex justify-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success-100 dark:bg-success-900/20">
                    <CheckCircle2 className="h-10 w-10 text-success-600" />
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-foreground mb-2">
                  Assignment Complete!
                </h3>
                <p className="text-muted-foreground mb-2">
                  Project has been created and assigned successfully
                </p>
                <p className="text-sm text-muted-foreground">
                  Project ID: <span className="font-mono font-medium">{state.assignmentId}</span>
                </p>

                <div className="mt-8 flex flex-col gap-3 max-w-md mx-auto">
                  <Button
                    onClick={handleReset}
                    icon={RefreshCw}
                    variant="secondary"
                    fullWidth
                  >
                    Assign Another Project
                  </Button>
                  <Button
                    onClick={() => {
                      if (onComplete && state.assignmentId) {
                        onComplete(state.assignmentId)
                      }
                      onClose()
                    }}
                    fullWidth
                  >
                    View Project
                  </Button>
                  <Button
                    onClick={onClose}
                    variant="ghost"
                    fullWidth
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
