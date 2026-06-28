/**
 * DOMAIN LAYER - WorkloadCalculator
 * Pure business logic for calculating associate workload
 * 
 * This class contains ZERO dependencies on:
 * - React
 * - Supabase
 * - UI components
 * 
 * It is a pure domain service that can be tested in isolation.
 */

export interface WorkloadData {
  activeProjects: number
  openingBalanceProjects: number
  completedProjects: number
  cancelledProjects: number
}

export class WorkloadCalculator {
  /**
   * Calculate total active workload
   * Active workload = projects NOT in (completed, cancelled) status
   */
  static calculateActiveWorkload(data: WorkloadData): number {
    return data.activeProjects + data.openingBalanceProjects
  }

  /**
   * Calculate total workload (including completed)
   */
  static calculateTotalWorkload(data: WorkloadData): number {
    return (
      data.activeProjects +
      data.openingBalanceProjects +
      data.completedProjects +
      data.cancelledProjects
    )
  }

  /**
   * Calculate available capacity
   */
  static calculateAvailableCapacity(
    weeklyCapacity: number,
    currentWorkload: number
  ): number {
    return Math.max(0, weeklyCapacity - currentWorkload)
  }

  /**
   * Check if associate has capacity
   */
  static hasCapacity(weeklyCapacity: number, currentWorkload: number): boolean {
    return currentWorkload < weeklyCapacity
  }

  /**
   * Get workload status
   */
  static getWorkloadStatus(
    currentWorkload: number,
    weeklyCapacity: number
  ): 'underutilized' | 'optimal' | 'overloaded' {
    const utilization = weeklyCapacity > 0 ? currentWorkload / weeklyCapacity : 0

    if (utilization < 0.5) return 'underutilized'
    if (utilization <= 1.0) return 'optimal'
    return 'overloaded'
  }
}
