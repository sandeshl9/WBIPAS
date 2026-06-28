/**
 * RECOMMENDATION ENGINE - Types
 * Core types for the recommendation engine
 * 
 * Version: 2.0.0 (Volume 4 Compliant)
 */

/**
 * Availability status for associates
 * Matches database enum: availability_status
 */
export type AvailabilityStatus = 
  | 'available'
  | 'leave'
  | 'training'
  | 'holiday'
  | 'inactive'

/**
 * Associate entity for recommendation engine
 * 
 * CRITICAL: Uses availabilityStatus instead of boolean isAvailable
 */
export interface Associate {
  id: string
  name: string
  email: string
  weeklyCapacity: number
  isActive: boolean
  availabilityStatus: AvailabilityStatus
  /** @deprecated Use availabilityStatus instead */
  isAvailable?: boolean
}

/**
 * Workload data for an associate
 * 
 * CRITICAL DISTINCTION:
 * - activeProjectCount: Total active projects across ALL weeks (used for fairness ranking)
 * - weeklyAssignedCount: Projects assigned in specific week (used for capacity eligibility)
 */
export interface WorkloadData {
  associateId: string
  /** Total active projects across ALL weeks (pending, assigned, in_progress, on_hold) */
  activeProjectCount: number
  /** Projects assigned in the SPECIFIC week being checked (for capacity eligibility) */
  weeklyAssignedCount?: number
  /** Earliest project date among all active projects (for FIFO) */
  oldestProjectDate: Date | null
}

/**
 * Recommendation reason codes
 */
export type RecommendationReason = 
  | 'lowest_workload'
  | 'fifo'
  | 'alphabetical'
  | 'capacity_only'
  | 'only_candidate'

/**
 * Structured explanation for recommendation
 */
export interface RecommendationExplanation {
  reasons: string[]
  workload: number
  capacity: number
  remainingCapacity: number
  fifoDate?: Date
  tiedCandidates?: number
}

/**
 * Single recommendation result
 */
export interface RecommendationResult {
  associate: Associate
  explanation: RecommendationExplanation
  /** Formatted explanation string (legacy) */
  explanationText: string
  workloadBefore: number
  workloadAfter: number
  reason: RecommendationReason
  /** Algorithm version used */
  engineVersion: string
}

/**
 * Ranked recommendation for preview (top N)
 */
export interface RankedRecommendation extends RecommendationResult {
  rank: number
  score: number
}

/**
 * Context for recommendation calculation
 */
export interface RecommendationContext {
  projectDate: Date
  weekNumber: number
  year: number
  availableAssociates: Associate[]
  workloadData: WorkloadData[]
  capacityOverrides?: Map<string, number>
}

/**
 * Simulation result for bulk assignment preview
 */
export interface SimulationResult {
  assignments: Array<{
    projectIndex: number
    associateId: string | null
    associateName: string | null
    reason: RecommendationReason | null
  }>
  distributionSummary: {
    associateId: string
    associateName: string
    projectsAssigned: number
    finalWorkload: number
  }[]
  fairnessMetrics: {
    standardDeviation: number
    balanceScore: number
    minWorkload: number
    maxWorkload: number
    averageWorkload: number
    giniCoefficient: number
  }
  failedAssignments: number
}
