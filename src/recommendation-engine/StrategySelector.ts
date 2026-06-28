/**
 * RECOMMENDATION ENGINE - Strategy Selector
 * 
 * Manages which recommendation strategy is currently active.
 * Allows switching strategies at runtime (e.g., via Settings).
 */

import type { IRecommendationStrategy } from './strategies/IRecommendationStrategy'
import { FIFORecommendationStrategy } from './strategies/FIFORecommendationStrategy'
import { AIRecommendationStrategy } from './strategies/AIRecommendationStrategy'

export type StrategyType = 'fifo' | 'ai' | 'balanced' | 'skill-based'

export class StrategySelector {
  private static currentStrategy: IRecommendationStrategy =
    new FIFORecommendationStrategy()

  /**
   * Get the currently active strategy
   */
  static getCurrentStrategy(): IRecommendationStrategy {
    return this.currentStrategy
  }

  /**
   * Set the active strategy
   */
  static setStrategy(type: StrategyType): void {
    switch (type) {
      case 'fifo':
        this.currentStrategy = new FIFORecommendationStrategy()
        break
      case 'ai':
        this.currentStrategy = new AIRecommendationStrategy()
        break
      case 'balanced':
        // Future implementation
        throw new Error('Balanced strategy not yet implemented')
      case 'skill-based':
        // Future implementation
        throw new Error('Skill-based strategy not yet implemented')
      default:
        throw new Error(`Unknown strategy type: ${type}`)
    }
  }

  /**
   * Get all available strategies
   */
  static getAvailableStrategies(): Array<{
    type: StrategyType
    name: string
    description: string
    available: boolean
  }> {
    return [
      {
        type: 'fifo',
        name: 'FIFO (Current)',
        description: 'Deterministic First In, First Out algorithm',
        available: true,
      },
      {
        type: 'ai',
        name: 'AI-Powered',
        description: 'Machine learning recommendations',
        available: false, // Will be true in V2
      },
      {
        type: 'balanced',
        name: 'Balanced Distribution',
        description: 'Prioritizes even distribution',
        available: false,
      },
      {
        type: 'skill-based',
        name: 'Skill Matching',
        description: 'Matches projects to associate skills',
        available: false,
      },
    ]
  }
}
