/**
 * RECOMMENDATION ENGINE - Strategy Exports
 * 
 * Version: 2.0.0 (Volume 4 Compliant)
 */

// Strategy Interface
export { IRecommendationStrategy } from './IRecommendationStrategy'

// Implemented Strategies
export { FIFORecommendationStrategy } from './FIFORecommendationStrategy'
export { BalancedRecommendationStrategy } from './BalancedRecommendationStrategy'

// Future Strategies (Placeholders)
export { SkillBasedRecommendationStrategy } from './SkillBasedRecommendationStrategy'
export { AIRecommendationStrategy } from './AIRecommendationStrategy'

// Strategy Factory
export { StrategyFactory, type StrategyType } from './StrategyFactory'
