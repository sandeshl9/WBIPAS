/**
 * RECOMMENDATION ENGINE - Balanced Recommendation Strategy
 * 
 * This strategy focuses purely on workload balance across all associates,
 * ignoring FIFO dates. Useful for scenarios where even distribution is
 * more important than project age.
 * 
 * Algorithm:
 * 1. Filter active & available associates
 * 2. Check capacity eligibility
 * 3. Select lowest workload
 * 4. Apply alphabetical tie-breaker (skip FIFO)
 * 
 * Use Case: When you want to maximize workload fairness
 * Status: Implemented (V2.0)
 */

import { CapacityEngine } from '../CapacityEngine'
import { WorkloadEngine } from '../WorkloadEngine'
import { AlphabeticalEngine } from '../AlphabeticalEngine'
import { RecommendationExplainer } from '../RecommendationExplainer'
import { ENGINE_VERSION } from '../AssignmentEngine'
import type { IRecommendationStrategy } from './IRecommendationStrategy'
import type { RecommendationContext, RecommendationResult } from '../types'

export class BalancedRecommendationStrategy implements IRecommendationStrategy {
  recommend(context: RecommendationContext): RecommendationResult | null {
    const { weekNumber, year } = context

    // Step 1: Filter active and available associates
    const activeAssociates = context.availableAssociates.filter((a) => {
      if (!a.isActive) return false
      if (a.availabilityStatus && a.availabilityStatus !== 'available') return false
      if (a.isAvailable !== undefined && !a.isAvailable) return false
      return true
    })

    if (activeAssociates.length === 0) {
      return null
    }

    // Step 2: Filter by capacity eligibility
    const eligibleAssociates = CapacityEngine.filterByCapacity(
      activeAssociates,
      context.workloadData,
      weekNumber,
      year
    )

    if (eligibleAssociates.length === 0) {
      return null
    }

    // Step 3: Attach workload data
    const associatesWithWorkload = WorkloadEngine.attachWorkload(
      eligibleAssociates,
      context.workloadData
    )

    // Step 4: Select those with lowest workload
    let candidates = WorkloadEngine.selectLowestWorkload(associatesWithWorkload)

    // Step 5: Apply alphabetical tie-breaker (SKIP FIFO)
    const winner = AlphabeticalEngine.applyAlphabetical(candidates)

    // Generate explanation
    const explanation = RecommendationExplainer.generateExplanation({
      selectedAssociate: winner.associate,
      currentWorkload: winner.workload,
      totalEligible: eligibleAssociates.length,
      tiedCandidates: candidates.length,
      reason: candidates.length === 1 ? 'lowest_workload' : 'alphabetical',
      oldestProjectDate: winner.oldestProjectDate || undefined,
    })

    return {
      associate: winner.associate,
      explanation,
      explanationText: RecommendationExplainer.generateTextExplanation(explanation),
      workloadBefore: winner.workload,
      workloadAfter: winner.workload + 1,
      reason: candidates.length === 1 ? 'lowest_workload' : 'alphabetical',
      engineVersion: ENGINE_VERSION,
    }
  }

  getName(): string {
    return 'Balanced Distribution'
  }

  getDescription(): string {
    return 'Prioritizes even workload distribution across all associates. Ignores project age and uses alphabetical tie-breaking for maximum fairness.'
  }

  canHandle(context: RecommendationContext): boolean {
    // Same validation as FIFO strategy
    return (
      context.availableAssociates.length > 0 &&
      context.weekNumber >= 1 &&
      context.weekNumber <= 53 &&
      context.year >= 2020 &&
      context.year <= 2100
    )
  }
}
