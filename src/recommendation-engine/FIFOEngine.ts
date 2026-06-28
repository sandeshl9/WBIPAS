/**
 * RECOMMENDATION ENGINE - FIFOEngine
 * Implements First In, First Out (FIFO) tie-breaking logic
 * 
 * Step 6 of the 11-step algorithm
 */

import type { AssociateWithWorkload } from './WorkloadEngine'

export class FIFOEngine {
  /**
   * Apply FIFO tie-breaking
   * 
   * When multiple associates have the same workload,
   * the one with the OLDEST active project wins.
   * 
   * This rewards associates who completed work earlier.
   */
  static applyFIFO(associates: AssociateWithWorkload[]): AssociateWithWorkload[] {
    if (associates.length <= 1) return associates

    // Find the oldest project date among all candidates
    const dates = associates
      .map((a) => a.oldestProjectDate)
      .filter((d): d is Date => d !== null)

    if (dates.length === 0) {
      // No one has any active projects
      return associates
    }

    const oldestDate = new Date(Math.min(...dates.map((d) => d.getTime())))

    // Return all associates who have that oldest date
    return associates.filter((a) => {
      if (!a.oldestProjectDate) return false
      return a.oldestProjectDate.getTime() === oldestDate.getTime()
    })
  }

  /**
   * Check if FIFO tie-breaking is needed
   */
  static needsFIFO(associates: AssociateWithWorkload[]): boolean {
    if (associates.length <= 1) return false

    const firstWorkload = associates[0].workload
    return associates.every((a) => a.workload === firstWorkload)
  }

  /**
   * Get oldest project date among candidates
   */
  static getOldestProjectDate(associates: AssociateWithWorkload[]): Date | null {
    const dates = associates
      .map((a) => a.oldestProjectDate)
      .filter((d): d is Date => d !== null)

    if (dates.length === 0) return null

    return new Date(Math.min(...dates.map((d) => d.getTime())))
  }
}
