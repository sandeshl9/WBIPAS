/**
 * RECOMMENDATION ENGINE - CapacityEngine
 * Handles capacity eligibility filtering
 * 
 * Step 3 of the 11-step algorithm
 * 
 * CRITICAL DISTINCTION (Volume 4):
 * - Weekly Capacity Check: Projects in SAME WEEK (eligibility only)
 * - Active Workload: Projects across ALL WEEKS (fairness ranking)
 * 
 * This module handles ONLY weekly capacity eligibility.
 * WorkloadEngine handles active workload for fairness.
 */

import type { Associate, WorkloadData } from './types'

export class CapacityEngine {
  /**
   * Filter associates who have capacity for the given week
   * 
   * IMPORTANT: Capacity is ONLY an eligibility filter.
   * It does NOT affect priority or selection.
   * 
   * Uses weeklyAssignedCount (same week only), NOT activeProjectCount (all weeks)
   */
  static filterByCapacity(
    associates: Associate[],
    workloadData: WorkloadData[],
    weekNumber: number,
    year: number
  ): Associate[] {
    return associates.filter((associate) => {
      const workload = workloadData.find((w) => w.associateId === associate.id)
      
      // Use weeklyAssignedCount if available (preferred - same week only)
      // Fall back to activeProjectCount for backwards compatibility
      const weeklyCount = workload?.weeklyAssignedCount ?? workload?.activeProjectCount ?? 0
      
      // Associate is eligible if weekly assigned count < weekly capacity
      return weeklyCount < associate.weeklyCapacity
    })
  }

  /**
   * Check if a specific associate has capacity for a specific week
   * 
   * @param associate - The associate to check
   * @param weekNumber - Week number to check
   * @param year - Year to check
   * @param workloadData - Workload data including weeklyAssignedCount
   */
  static hasCapacityForWeek(
    associate: Associate,
    weekNumber: number,
    year: number,
    workloadData: WorkloadData[]
  ): boolean {
    const workload = workloadData.find((w) => w.associateId === associate.id)
    const weeklyCount = workload?.weeklyAssignedCount ?? 0
    
    return weeklyCount < associate.weeklyCapacity
  }

  /**
   * Get weekly assigned count for an associate
   * 
   * @returns Number of projects assigned in the specific week
   */
  static getWeeklyAssignedCount(
    associateId: string,
    workloadData: WorkloadData[]
  ): number {
    const workload = workloadData.find((w) => w.associateId === associateId)
    return workload?.weeklyAssignedCount ?? 0
  }

  /**
   * Get remaining capacity for a specific week
   */
  static getRemainingCapacity(
    associate: Associate,
    workloadData: WorkloadData[]
  ): number {
    const weeklyCount = this.getWeeklyAssignedCount(associate.id, workloadData)
    return Math.max(0, associate.weeklyCapacity - weeklyCount)
  }

  /**
   * Get associates who are at capacity for specific week
   */
  static getAtCapacity(
    associates: Associate[],
    workloadData: WorkloadData[]
  ): Associate[] {
    return associates.filter((associate) => {
      const remaining = this.getRemainingCapacity(associate, workloadData)
      return remaining === 0
    })
  }

  /**
   * Check if a specific associate has capacity (legacy method)
   * @deprecated Use hasCapacityForWeek instead
   */
  static hasCapacity(
    associate: Associate,
    workloadData: WorkloadData[]
  ): boolean {
    const workload = workloadData.find((w) => w.associateId === associate.id)
    const weeklyCount = workload?.weeklyAssignedCount ?? workload?.activeProjectCount ?? 0
    
    return weeklyCount < associate.weeklyCapacity
  }

  /**
   * Get capacity utilization percentage for a week
   */
  static getCapacityUtilization(
    associate: Associate,
    workloadData: WorkloadData[]
  ): number {
    if (associate.weeklyCapacity === 0) return 0
    
    const weeklyCount = this.getWeeklyAssignedCount(associate.id, workloadData)
    return Math.round((weeklyCount / associate.weeklyCapacity) * 100)
  }
}

