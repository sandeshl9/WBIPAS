/**
 * RECOMMENDATION ENGINE - AssignmentEngine
 * Main orchestrator for the 11-step recommendation algorithm
 * 
 * This is the heart of WBIPAS.
 * 
 * Version: 2.0.0 (Volume 4 Compliant)
 * 
 * IMPORTANT: This module has ZERO dependencies on:
 * - React
 * - React components
 * - Supabase client
 * - UI state
 * 
 * It is a pure domain service that implements business rules.
 */

import { CapacityEngine } from './CapacityEngine'
import { WorkloadEngine } from './WorkloadEngine'
import { FIFOEngine } from './FIFOEngine'
import { AlphabeticalEngine } from './AlphabeticalEngine'
import { RecommendationExplainer } from './RecommendationExplainer'
import { FairnessCalculator } from './FairnessCalculator'
import { getWeekNumber, getYear } from '@/lib/utils'
import type {
  Associate,
  WorkloadData,
  RecommendationResult,
  RankedRecommendation,
  RecommendationContext,
  SimulationResult,
  RecommendationReason,
} from './types'

/**
 * Engine version - incremented with each algorithm change
 * Stored with each recommendation for audit trail
 */
export const ENGINE_VERSION = '2.0.0'

export class AssignmentEngine {
  /**
   * Execute the complete 11-step recommendation algorithm
   * 
   * Steps:
   * 1. Determine project week ✓
   * 2. Filter active & available associates ✓
   * 3. Check capacity eligibility ✓
   * 4. Calculate workload ✓
   * 5. Select lowest workload ✓
   * 6. Apply FIFO ✓
   * 7. Apply alphabetical ✓
   * 8. Generate explanation ✓
   * 9-11. (Handled by application layer)
   */
  static getRecommendation(context: RecommendationContext): RecommendationResult | null {
    // Step 1: Project week is already in context
    const { weekNumber, year } = context

    // Step 2: Filter active and available associates
    const activeAssociates = context.availableAssociates.filter((a) => {
      // Check isActive flag
      if (!a.isActive) return false
      
      // Check availability status (new way)
      if (a.availabilityStatus && a.availabilityStatus !== 'available') {
        return false
      }
      
      // Backwards compatibility: check isAvailable flag
      if (a.isAvailable !== undefined && !a.isAvailable) {
        return false
      }
      
      return true
    })

    if (activeAssociates.length === 0) {
      return null // No available associates
    }

    // Step 3: Filter by capacity eligibility
    const eligibleAssociates = CapacityEngine.filterByCapacity(
      activeAssociates,
      context.workloadData,
      weekNumber,
      year
    )

    if (eligibleAssociates.length === 0) {
      return null // No one has capacity
    }

    // Step 4: Attach workload data
    const associatesWithWorkload = WorkloadEngine.attachWorkload(
      eligibleAssociates,
      context.workloadData
    )

    // Step 5: Select those with lowest workload
    let candidates = WorkloadEngine.selectLowestWorkload(associatesWithWorkload)

    let reason: RecommendationReason = 'lowest_workload'

    // If only one candidate, we're done
    if (candidates.length === 1) {
      return this.buildResult(
        candidates[0],
        reason,
        eligibleAssociates.length,
        candidates.length
      )
    }

    // Step 6: Apply FIFO if needed
    if (FIFOEngine.needsFIFO(candidates)) {
      candidates = FIFOEngine.applyFIFO(candidates)
      reason = 'fifo'
    }

    // If only one after FIFO, we're done
    if (candidates.length === 1) {
      return this.buildResult(
        candidates[0],
        reason,
        eligibleAssociates.length,
        candidates.length
      )
    }

    // Step 7: Apply alphabetical tie-breaker
    const winner = AlphabeticalEngine.applyAlphabetical(candidates)
    reason = 'alphabetical'

    return this.buildResult(
      winner,
      reason,
      eligibleAssociates.length,
      candidates.length
    )
  }

  /**
   * Get top N recommendations (ranked)
   * 
   * Enterprise feature: Shows manager the top 5 candidates
   * Provides transparency without changing the deterministic algorithm
   */
  static getTopCandidates(
    context: RecommendationContext,
    limit: number = 5
  ): RankedRecommendation[] {
    const { weekNumber, year } = context

    // Filter active and available associates
    const activeAssociates = context.availableAssociates.filter((a) => {
      if (!a.isActive) return false
      if (a.availabilityStatus && a.availabilityStatus !== 'available') return false
      if (a.isAvailable !== undefined && !a.isAvailable) return false
      return true
    })

    if (activeAssociates.length === 0) {
      return []
    }

    // Filter by capacity
    const eligibleAssociates = CapacityEngine.filterByCapacity(
      activeAssociates,
      context.workloadData,
      weekNumber,
      year
    )

    if (eligibleAssociates.length === 0) {
      return []
    }

    // Attach workload
    const associatesWithWorkload = WorkloadEngine.attachWorkload(
      eligibleAssociates,
      context.workloadData
    )

    // Sort by: workload (asc), oldest project date (asc), name (asc)
    const sorted = [...associatesWithWorkload].sort((a, b) => {
      // First: workload
      if (a.workload !== b.workload) {
        return a.workload - b.workload
      }

      // Second: FIFO
      if (a.oldestProjectDate && b.oldestProjectDate) {
        const timeA = a.oldestProjectDate.getTime()
        const timeB = b.oldestProjectDate.getTime()
        if (timeA !== timeB) {
          return timeA - timeB
        }
      } else if (a.oldestProjectDate) {
        return -1
      } else if (b.oldestProjectDate) {
        return 1
      }

      // Third: alphabetical
      return a.associate.name.localeCompare(b.associate.name)
    })

    // Build ranked recommendations
    const ranked: RankedRecommendation[] = []
    const topN = sorted.slice(0, limit)

    topN.forEach((candidate, index) => {
      const rank = index + 1
      const reason = this.determineReason(candidate, sorted)
      
      const explanation = RecommendationExplainer.generateExplanation({
        selectedAssociate: candidate.associate,
        currentWorkload: candidate.workload,
        totalEligible: eligibleAssociates.length,
        tiedCandidates: sorted.filter(c => c.workload === candidate.workload).length,
        reason,
        oldestProjectDate: candidate.oldestProjectDate || undefined,
      })

      ranked.push({
        rank,
        score: this.calculateScore(candidate, sorted),
        associate: candidate.associate,
        explanation,
        explanationText: RecommendationExplainer.generateTextExplanation(explanation),
        workloadBefore: candidate.workload,
        workloadAfter: candidate.workload + 1,
        reason,
        engineVersion: ENGINE_VERSION,
      })
    })

    return ranked
  }

  /**
   * Simulate bulk assignment
   * 
   * Enterprise feature: Preview distribution before committing
   * Returns assignments + fairness metrics
   */
  static simulateDistribution(
    projects: Array<{ date: Date }>,
    context: RecommendationContext
  ): SimulationResult {
    const assignments: SimulationResult['assignments'] = []
    const distributionMap = new Map<string, { name: string; count: number; workload: number }>()
    
    // Initialize distribution map
    context.availableAssociates.forEach((associate) => {
      const workload = context.workloadData.find(w => w.associateId === associate.id)
      distributionMap.set(associate.id, {
        name: associate.name,
        count: 0,
        workload: workload?.activeProjectCount || 0,
      })
    })

    let currentWorkloadData = [...context.workloadData]
    let failedCount = 0

    // Simulate each assignment
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i]
      
      const updatedContext: RecommendationContext = {
        ...context,
        projectDate: project.date,
        weekNumber: getWeekNumber(project.date),
        year: getYear(project.date),
        workloadData: currentWorkloadData,
      }

      const recommendation = this.getRecommendation(updatedContext)

      if (recommendation) {
        assignments.push({
          projectIndex: i,
          associateId: recommendation.associate.id,
          associateName: recommendation.associate.name,
          reason: recommendation.reason,
        })

        // Update distribution
        const dist = distributionMap.get(recommendation.associate.id)
        if (dist) {
          dist.count++
          dist.workload++
        }

        // Update workload for next iteration
        currentWorkloadData = currentWorkloadData.map((w) =>
          w.associateId === recommendation.associate.id
            ? { ...w, activeProjectCount: w.activeProjectCount + 1 }
            : w
        )
      } else {
        assignments.push({
          projectIndex: i,
          associateId: null,
          associateName: null,
          reason: null,
        })
        failedCount++
      }
    }

    // Build distribution summary
    const distributionSummary = Array.from(distributionMap.entries()).map(
      ([associateId, data]) => ({
        associateId,
        associateName: data.name,
        projectsAssigned: data.count,
        finalWorkload: data.workload,
      })
    )

    // Calculate fairness metrics
    const workloads = distributionSummary.map((d) => d.finalWorkload)
    const fairnessMetrics = FairnessCalculator.calculateMetrics(workloads)

    return {
      assignments,
      distributionSummary,
      fairnessMetrics,
      failedAssignments: failedCount,
    }
  }

  /**
   * Build the final recommendation result
   */
  private static buildResult(
    winner: { associate: Associate; workload: number; oldestProjectDate: Date | null },
    reason: RecommendationReason,
    totalEligible: number,
    tiedCandidates: number
  ): RecommendationResult {
    const explanation = RecommendationExplainer.generateExplanation({
      selectedAssociate: winner.associate,
      currentWorkload: winner.workload,
      totalEligible,
      tiedCandidates,
      reason,
      oldestProjectDate: winner.oldestProjectDate || undefined,
    })

    return {
      associate: winner.associate,
      explanation,
      explanationText: RecommendationExplainer.generateTextExplanation(explanation),
      workloadBefore: winner.workload,
      workloadAfter: winner.workload + 1,
      reason,
      engineVersion: ENGINE_VERSION,
    }
  }

  /**
   * Calculate score for ranking (lower is better)
   */
  private static calculateScore(
    candidate: { associate: Associate; workload: number; oldestProjectDate: Date | null },
    allCandidates: typeof candidate[]
  ): number {
    const maxWorkload = Math.max(...allCandidates.map(c => c.workload), 1)
    const workloadScore = candidate.workload / maxWorkload * 100

    // Lower score = better candidate
    return Math.round(workloadScore)
  }

  /**
   * Determine reason for a candidate
   */
  private static determineReason(
    candidate: { associate: Associate; workload: number; oldestProjectDate: Date | null },
    allCandidates: typeof candidate[]
  ): RecommendationReason {
    const minWorkload = Math.min(...allCandidates.map(c => c.workload))
    
    if (candidate.workload > minWorkload) {
      return 'capacity_only'
    }

    const sameWorkload = allCandidates.filter(c => c.workload === candidate.workload)
    
    if (sameWorkload.length === 1) {
      return 'lowest_workload'
    }

    // Check FIFO
    const candidateTime = candidate.oldestProjectDate?.getTime() || Infinity
    const hasBetterFIFO = sameWorkload.some(
      c => c.oldestProjectDate && c.oldestProjectDate.getTime() < candidateTime
    )

    if (hasBetterFIFO) {
      return 'alphabetical'
    }

    const sameFIFO = sameWorkload.filter(
      c => c.oldestProjectDate?.getTime() === candidateTime
    )

    if (sameFIFO.length > 1) {
      return 'alphabetical'
    }

    return 'fifo'
  }

  /**
   * Validate recommendation context
   */
  static validateContext(context: RecommendationContext): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!context.projectDate) {
      errors.push('Project date is required')
    }

    if (context.availableAssociates.length === 0) {
      errors.push('No associates available')
    }

    if (context.weekNumber < 1 || context.weekNumber > 53) {
      errors.push('Invalid week number')
    }

    if (context.year < 2020 || context.year > 2100) {
      errors.push('Invalid year')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Get engine metadata
   */
  static getEngineInfo(): {
    version: string
    algorithm: string
    steps: string[]
  } {
    return {
      version: ENGINE_VERSION,
      algorithm: 'Deterministic FIFO with Capacity Balancing',
      steps: [
        'Determine project week',
        'Filter active & available associates',
        'Check weekly capacity eligibility',
        'Calculate active workload',
        'Select lowest workload',
        'Apply FIFO tie-breaker',
        'Apply alphabetical tie-breaker',
        'Generate explanation',
        'Wait for confirmation',
        'Assign in transaction',
        'Update audit trail',
      ],
    }
  }
}
