/**
 * RECOMMENDATION ENGINE - FIFO Recommendation Strategy
 * 
 * This is the current, deterministic recommendation strategy
 * that implements the 11-step algorithm from the PRD.
 */

import { AssignmentEngine } from '../AssignmentEngine'
import type { IRecommendationStrategy } from './IRecommendationStrategy'
import type { RecommendationContext, RecommendationResult } from '../types'

export class FIFORecommendationStrategy implements IRecommendationStrategy {
  recommend(context: RecommendationContext): RecommendationResult | null {
    return AssignmentEngine.getRecommendation(context)
  }

  getName(): string {
    return 'FIFO (Deterministic)'
  }

  getDescription(): string {
    return 'First In, First Out strategy with capacity-based eligibility, workload balancing, and alphabetical tie-breaking'
  }

  canHandle(context: RecommendationContext): boolean {
    const validation = AssignmentEngine.validateContext(context)
    return validation.valid
  }
}
