/**
 * DOMAIN LAYER - CapacityCalculator
 * Pure business logic for capacity calculations
 * 
 * This class handles all capacity-related business rules.
 */

export interface CapacityOverride {
  weekNumber: number
  year: number
  weeklyCapacity: number
}

export class CapacityCalculator {
  /**
   * Get effective capacity for a specific week
   * Checks for week-specific override, falls back to default
   */
  static getEffectiveCapacity(
    defaultCapacity: number,
    weekNumber: number,
    year: number,
    overrides: CapacityOverride[]
  ): number {
    const override = overrides.find(
      (o) => o.weekNumber === weekNumber && o.year === year
    )

    return override ? override.weeklyCapacity : defaultCapacity
  }

  /**
   * Calculate utilization percentage
   */
  static calculateUtilization(
    currentWorkload: number,
    capacity: number
  ): number {
    if (capacity === 0) return 0
    return Math.round((currentWorkload / capacity) * 100 * 100) / 100 // 2 decimal places
  }

  /**
   * Check if capacity is exceeded
   */
  static isCapacityExceeded(currentWorkload: number, capacity: number): boolean {
    return currentWorkload >= capacity
  }

  /**
   * Get remaining capacity
   */
  static getRemainingCapacity(
    currentWorkload: number,
    capacity: number
  ): number {
    return Math.max(0, capacity - currentWorkload)
  }

  /**
   * Validate capacity value
   */
  static isValidCapacity(capacity: number): boolean {
    return capacity > 0 && capacity <= 100
  }
}
