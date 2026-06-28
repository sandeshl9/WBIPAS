/**
 * RECOMMENDATION ENGINE - Strategy Interface
 * 
 * This interface allows different recommendation strategies to be plugged in.
 * 
 * Future implementations:
 * - FIFORecommendationStrategy (current, deterministic)
 * - BalancedRecommendationStrategy (distribute evenly)
 * - SkillBasedRecommendationStrategy (match skills)
 * - AIRecommendationStrategy (machine learning)
 */

import type { RecommendationContext, RecommendationResult } from '../types'

export interface IRecommendationStrategy {
  /**
   * Get recommendation using this strategy
   */
  recommend(context: RecommendationContext): RecommendationResult | null

  /**
   * Strategy name for display and logging
   */
  getName(): string

  /**
   * Strategy description
   */
  getDescription(): string

  /**
   * Validate if this strategy can handle the context
   */
  canHandle(context: RecommendationContext): boolean
}
