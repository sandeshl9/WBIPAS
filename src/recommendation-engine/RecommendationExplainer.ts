/**
 * RECOMMENDATION ENGINE - RecommendationExplainer
 * Generates human-readable explanations for recommendations
 * 
 * Step 8 of the 11-step algorithm
 * 
 * Version 2.0: Returns structured explanation data
 */

import type { Associate, RecommendationExplanation, RecommendationReason } from './types'

interface ExplanationParams {
  selectedAssociate: Associate
  currentWorkload: number
  totalEligible: number
  tiedCandidates: number
  reason: RecommendationReason
  oldestProjectDate?: Date
}

export class RecommendationExplainer {
  /**
   * Generate structured explanation for recommendation
   * 
   * Returns both structured data and formatted text
   */
  static generateExplanation(params: ExplanationParams): RecommendationExplanation {
    const {
      selectedAssociate,
      currentWorkload,
      totalEligible,
      tiedCandidates,
      reason,
      oldestProjectDate,
    } = params

    const reasons: string[] = []
    const remainingCapacity = selectedAssociate.weeklyCapacity - currentWorkload

    // Build reason list
    reasons.push('Weekly capacity available')

    if (totalEligible === 1) {
      reasons.push('Only eligible associate')
    } else {
      if (reason === 'lowest_workload') {
        reasons.push(`Lowest active workload (${currentWorkload} projects)`)
      } else if (reason === 'fifo') {
        reasons.push(`Lowest active workload (${currentWorkload} projects)`)
        if (oldestProjectDate) {
          reasons.push(`Oldest active project (${this.formatDate(oldestProjectDate)})`)
        }
        reasons.push('FIFO tie-breaker applied')
      } else if (reason === 'alphabetical') {
        reasons.push(`Lowest active workload (${currentWorkload} projects)`)
        if (oldestProjectDate) {
          reasons.push(`Tied on FIFO date (${this.formatDate(oldestProjectDate)})`)
        }
        reasons.push('Alphabetical tie-breaker applied')
      } else if (reason === 'only_candidate') {
        reasons.push('Only candidate after filtering')
      }

      if (tiedCandidates > 1) {
        reasons.push(`Selected from ${tiedCandidates} tied candidates`)
      }
    }

    return {
      reasons,
      workload: currentWorkload,
      capacity: selectedAssociate.weeklyCapacity,
      remainingCapacity,
      fifoDate: oldestProjectDate,
      tiedCandidates: tiedCandidates > 1 ? tiedCandidates : undefined,
    }
  }

  /**
   * Generate legacy text explanation from structured data
   */
  static generateTextExplanation(explanation: RecommendationExplanation): string {
    return explanation.reasons.join(' • ')
  }

  /**
   * Generate detailed explanation with all metadata
   */
  static generateDetailedExplanation(
    associateName: string,
    explanation: RecommendationExplanation
  ): string {
    const lines: string[] = [
      `✓ Recommended: ${associateName}`,
      '',
      'Reasons:',
      ...explanation.reasons.map((r) => `  • ${r}`),
      '',
      `Current Workload: ${explanation.workload} projects`,
      `Weekly Capacity: ${explanation.capacity} projects`,
      `Remaining Capacity: ${explanation.remainingCapacity} projects`,
    ]

    if (explanation.fifoDate) {
      lines.push(`FIFO Date: ${this.formatDate(explanation.fifoDate)}`)
    }

    return lines.join('\n')
  }

  /**
   * Format date for display
   */
  private static formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  }

  /**
   * Generate explanation for no recommendation available
   */
  static generateNoRecommendationExplanation(
    totalAssociates: number,
    activeAssociates: number,
    atCapacity: number
  ): string {
    if (totalAssociates === 0) {
      return 'No associates available in the system'
    }

    if (activeAssociates === 0) {
      return 'No active or available associates found'
    }

    if (atCapacity === activeAssociates) {
      return 'All associates are at full capacity for this week'
    }

    return 'No eligible associate found for assignment'
  }

  /**
   * Generate explanation for override
   */
  static generateOverrideExplanation(
    recommendedAssociate: string,
    assignedAssociate: string,
    reason?: string
  ): string {
    const parts = [
      `Manager override: ${assignedAssociate} assigned instead of recommended ${recommendedAssociate}`,
    ]

    if (reason) {
      parts.push(`Reason: ${reason}`)
    }

    return parts.join(' • ')
  }

  /**
   * Generate short summary (legacy compatibility)
   */
  static generateSummary(params: ExplanationParams): string {
    const { selectedAssociate, currentWorkload, reason } = params

    switch (reason) {
      case 'lowest_workload':
        return `${selectedAssociate.name} (${currentWorkload} projects) - Lowest workload`
      case 'fifo':
        return `${selectedAssociate.name} (${currentWorkload} projects) - FIFO winner`
      case 'alphabetical':
        return `${selectedAssociate.name} (${currentWorkload} projects) - Alphabetical`
      case 'only_candidate':
      case 'capacity_only':
        return `${selectedAssociate.name} (${currentWorkload} projects) - Only available`
      default:
        return `${selectedAssociate.name} (${currentWorkload} projects)`
    }
  }
}
