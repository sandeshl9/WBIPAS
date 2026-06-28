/**
 * RECOMMENDATION ENGINE - FairnessCalculator
 * Calculates fairness metrics for workload distribution
 * 
 * Used for:
 * - Simulation mode analysis
 * - Management reports
 * - Algorithm performance evaluation
 */

export interface FairnessMetrics {
  /** Standard deviation of workload distribution */
  standardDeviation: number
  /** Balance score (0-100, higher is better) */
  balanceScore: number
  /** Minimum workload across all associates */
  minWorkload: number
  /** Maximum workload across all associates */
  maxWorkload: number
  /** Average workload */
  averageWorkload: number
  /** Gini coefficient (0-1, 0 = perfect equality) */
  giniCoefficient: number
}

export class FairnessCalculator {
  /**
   * Calculate comprehensive fairness metrics
   */
  static calculateMetrics(workloads: number[]): FairnessMetrics {
    if (workloads.length === 0) {
      return {
        standardDeviation: 0,
        balanceScore: 100,
        minWorkload: 0,
        maxWorkload: 0,
        averageWorkload: 0,
        giniCoefficient: 0,
      }
    }

    const min = Math.min(...workloads)
    const max = Math.max(...workloads)
    const average = workloads.reduce((sum, w) => sum + w, 0) / workloads.length

    return {
      standardDeviation: this.calculateStandardDeviation(workloads, average),
      balanceScore: this.calculateBalanceScore(workloads),
      minWorkload: min,
      maxWorkload: max,
      averageWorkload: average,
      giniCoefficient: this.calculateGiniCoefficient(workloads),
    }
  }

  /**
   * Calculate standard deviation
   */
  private static calculateStandardDeviation(workloads: number[], mean: number): number {
    if (workloads.length === 0) return 0

    const squaredDiffs = workloads.map((w) => Math.pow(w - mean, 2))
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / workloads.length
    
    return Math.sqrt(variance)
  }

  /**
   * Calculate balance score (0-100)
   * 
   * Score interpretation:
   * - 100: Perfect balance (all equal)
   * - 90-99: Excellent balance
   * - 80-89: Good balance
   * - 70-79: Fair balance
   * - <70: Poor balance
   */
  static calculateBalanceScore(workloads: number[]): number {
    if (workloads.length === 0) return 100
    if (workloads.length === 1) return 100

    const min = Math.min(...workloads)
    const max = Math.max(...workloads)
    
    // Perfect balance
    if (min === max) return 100
    
    // Calculate balance based on range
    const average = workloads.reduce((sum, w) => sum + w, 0) / workloads.length
    if (average === 0) return 100

    const range = max - min
    const rangePercent = (range / average) * 100
    
    // Convert to 0-100 score (inverse of range percentage)
    // If range is 0% of average = 100 score
    // If range is 100% of average = 0 score
    const score = Math.max(0, 100 - rangePercent)
    
    return Math.round(score * 10) / 10
  }

  /**
   * Calculate Gini coefficient
   * 
   * Gini coefficient measures statistical dispersion
   * - 0: Perfect equality
   * - 1: Maximum inequality
   * 
   * Formula: Gini = (2 * sum of (rank * value)) / (n * sum of values) - (n + 1) / n
   */
  static calculateGiniCoefficient(workloads: number[]): number {
    if (workloads.length === 0) return 0
    if (workloads.length === 1) return 0

    // Sort workloads in ascending order
    const sorted = [...workloads].sort((a, b) => a - b)
    const n = sorted.length
    const sum = sorted.reduce((acc, val) => acc + val, 0)

    // If all workloads are 0, Gini is 0
    if (sum === 0) return 0

    // Calculate Gini coefficient
    let numerator = 0
    for (let i = 0; i < n; i++) {
      numerator += (i + 1) * sorted[i]
    }

    const gini = (2 * numerator) / (n * sum) - (n + 1) / n

    return Math.round(gini * 1000) / 1000
  }

  /**
   * Determine if distribution is fair based on metrics
   */
  static isFairDistribution(metrics: FairnessMetrics, threshold: number = 80): boolean {
    return metrics.balanceScore >= threshold
  }

  /**
   * Get fairness assessment text
   */
  static getFairnessAssessment(metrics: FairnessMetrics): {
    level: 'excellent' | 'good' | 'fair' | 'poor'
    message: string
  } {
    const score = metrics.balanceScore

    if (score >= 90) {
      return {
        level: 'excellent',
        message: 'Workload distribution is excellent with minimal variation',
      }
    } else if (score >= 80) {
      return {
        level: 'good',
        message: 'Workload distribution is good with acceptable variation',
      }
    } else if (score >= 70) {
      return {
        level: 'fair',
        message: 'Workload distribution is fair but shows some imbalance',
      }
    } else {
      return {
        level: 'poor',
        message: 'Workload distribution shows significant imbalance',
      }
    }
  }

  /**
   * Compare two distributions
   */
  static compareFairness(
    metrics1: FairnessMetrics,
    metrics2: FairnessMetrics
  ): {
    better: 'first' | 'second' | 'equal'
    difference: number
    reason: string
  } {
    const diff = metrics1.balanceScore - metrics2.balanceScore

    if (Math.abs(diff) < 1) {
      return {
        better: 'equal',
        difference: 0,
        reason: 'Both distributions are equally balanced',
      }
    }

    if (diff > 0) {
      return {
        better: 'first',
        difference: diff,
        reason: `First distribution is ${diff.toFixed(1)} points more balanced`,
      }
    }

    return {
      better: 'second',
      difference: Math.abs(diff),
      reason: `Second distribution is ${Math.abs(diff).toFixed(1)} points more balanced`,
    }
  }
}
