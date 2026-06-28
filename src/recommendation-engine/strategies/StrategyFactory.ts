/**
 * RECOMMENDATION ENGINE - Strategy Factory
 * 
 * Central registry for all recommendation strategies.
 * Allows runtime selection of strategy based on configuration.
 * 
 * Version: 2.0.0
 */

import { FIFORecommendationStrategy } from './FIFORecommendationStrategy'
import { BalancedRecommendationStrategy } from './BalancedRecommendationStrategy'
import { SkillBasedRecommendationStrategy } from './SkillBasedRecommendationStrategy'
import { AIRecommendationStrategy } from './AIRecommendationStrategy'
import type { IRecommendationStrategy } from './IRecommendationStrategy'

export type StrategyType = 'fifo' | 'balanced' | 'skill-based' | 'ai'

export class StrategyFactory {
  private static strategies: Map<StrategyType, IRecommendationStrategy> = new Map([
    ['fifo', new FIFORecommendationStrategy()],
    ['balanced', new BalancedRecommendationStrategy()],
    ['skill-based', new SkillBasedRecommendationStrategy()],
    ['ai', new AIRecommendationStrategy()],
  ])

  /**
   * Get strategy by type
   */
  static getStrategy(type: StrategyType): IRecommendationStrategy {
    const strategy = this.strategies.get(type)
    
    if (!strategy) {
      throw new Error(`Unknown strategy type: ${type}`)
    }

    return strategy
  }

  /**
   * Get default strategy (FIFO)
   */
  static getDefaultStrategy(): IRecommendationStrategy {
    return this.getStrategy('fifo')
  }

  /**
   * Get all available strategies
   */
  static getAllStrategies(): Array<{
    type: StrategyType
    name: string
    description: string
    available: boolean
  }> {
    return Array.from(this.strategies.entries()).map(([type, strategy]) => ({
      type,
      name: strategy.getName(),
      description: strategy.getDescription(),
      available: type === 'fifo' || type === 'balanced', // Only implemented strategies
    }))
  }

  /**
   * Check if strategy is available (implemented)
   */
  static isStrategyAvailable(type: StrategyType): boolean {
    const strategy = this.strategies.get(type)
    return strategy !== undefined && (type === 'fifo' || type === 'balanced')
  }

  /**
   * Get strategy metadata
   */
  static getStrategyInfo(type: StrategyType): {
    type: StrategyType
    name: string
    description: string
    available: boolean
  } | null {
    const strategy = this.strategies.get(type)
    
    if (!strategy) {
      return null
    }

    return {
      type,
      name: strategy.getName(),
      description: strategy.getDescription(),
      available: this.isStrategyAvailable(type),
    }
  }

  /**
   * Validate strategy can handle context
   */
  static canHandleContext(
    type: StrategyType,
    context: Parameters<IRecommendationStrategy['canHandle']>[0]
  ): boolean {
    const strategy = this.getStrategy(type)
    return strategy.canHandle(context)
  }

  /**
   * Register custom strategy (for extensions)
   */
  static registerStrategy(type: string, strategy: IRecommendationStrategy): void {
    // Cast to any for custom types
    this.strategies.set(type as StrategyType, strategy)
  }
}
