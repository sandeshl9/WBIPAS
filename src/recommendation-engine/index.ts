/**
 * RECOMMENDATION ENGINE - Public API
 * 
 * Version: 2.0.0 (Volume 4 Compliant)
 * 
 * This module exports the recommendation engine's public interface.
 * All business logic is isolated from React, Supabase, and UI concerns.
 */

// Main Engine
export { AssignmentEngine, ENGINE_VERSION } from './AssignmentEngine'

// Core Components
export { CapacityEngine } from './CapacityEngine'
export { WorkloadEngine } from './WorkloadEngine'
export { FIFOEngine } from './FIFOEngine'
export { AlphabeticalEngine } from './AlphabeticalEngine'
export { RecommendationExplainer } from './RecommendationExplainer'
export { FairnessCalculator } from './FairnessCalculator'

// Strategy Pattern
export { IRecommendationStrategy } from './strategies/IRecommendationStrategy'
export { FIFORecommendationStrategy } from './strategies/FIFORecommendationStrategy'
export { BalancedRecommendationStrategy } from './strategies/BalancedRecommendationStrategy'
export { SkillBasedRecommendationStrategy } from './strategies/SkillBasedRecommendationStrategy'
export { AIRecommendationStrategy } from './strategies/AIRecommendationStrategy'
export { StrategyFactory, type StrategyType } from './strategies/StrategyFactory'

// Types
export type {
  Associate,
  AvailabilityStatus,
  WorkloadData,
  RecommendationResult,
  RankedRecommendation,
  RecommendationContext,
  RecommendationReason,
  RecommendationExplanation,
  SimulationResult,
} from './types'

export type { FairnessMetrics } from './FairnessCalculator'
export type { AssociateWithWorkload } from './WorkloadEngine'
