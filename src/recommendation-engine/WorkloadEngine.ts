/**
 * RECOMMENDATION ENGINE - WorkloadEngine
 * Calculates and compares workload across associates
 * 
 * Step 4-5 of the 11-step algorithm
 */

import type { Associate, WorkloadData } from './types'

export interface AssociateWithWorkload {
  associate: Associate
  workload: number
  oldestProjectDate: Date | null
}

export class WorkloadEngine {
  /**
   * Attach workload data to associates
   */
  static attachWorkload(
    associates: Associate[],
    workloadData: WorkloadData[]
  ): AssociateWithWorkload[] {
    return associates.map((associate) => {
      const data = workloadData.find((w) => w.associateId === associate.id)
      
      return {
        associate,
        workload: data?.activeProjectCount || 0,
        oldestProjectDate: data?.oldestProjectDate || null,
      }
    })
  }

  /**
   * Find the minimum workload value
   */
  static getMinimumWorkload(associates: AssociateWithWorkload[]): number {
    if (associates.length === 0) return 0
    return Math.min(...associates.map((a) => a.workload))
  }

  /**
   * Filter associates with the lowest workload
   * 
   * This is Step 5 of the algorithm
   */
  static selectLowestWorkload(
    associates: AssociateWithWorkload[]
  ): AssociateWithWorkload[] {
    const minWorkload = this.getMinimumWorkload(associates)
    return associates.filter((a) => a.workload === minWorkload)
  }

  /**
   * Get workload distribution summary
   */
  static getWorkloadDistribution(associates: AssociateWithWorkload[]): {
    min: number
    max: number
    average: number
    total: number
  } {
    if (associates.length === 0) {
      return { min: 0, max: 0, average: 0, total: 0 }
    }

    const workloads = associates.map((a) => a.workload)
    const total = workloads.reduce((sum, w) => sum + w, 0)

    return {
      min: Math.min(...workloads),
      max: Math.max(...workloads),
      average: total / associates.length,
      total,
    }
  }
}
