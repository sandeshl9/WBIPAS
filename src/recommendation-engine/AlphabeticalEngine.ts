/**
 * RECOMMENDATION ENGINE - AlphabeticalEngine
 * Final tie-breaker using alphabetical sorting
 * 
 * Step 7 of the 11-step algorithm
 */

import type { AssociateWithWorkload } from './WorkloadEngine'

export class AlphabeticalEngine {
  /**
   * Apply alphabetical tie-breaking
   * 
   * When all else is equal (same workload, same oldest project date),
   * sort by name alphabetically and select the first.
   * 
   * This ensures deterministic results (same input = same output).
   */
  static applyAlphabetical(
    associates: AssociateWithWorkload[]
  ): AssociateWithWorkload {
    if (associates.length === 0) {
      throw new Error('Cannot apply alphabetical sort to empty array')
    }

    if (associates.length === 1) {
      return associates[0]
    }

    // Sort by name (case-insensitive)
    const sorted = [...associates].sort((a, b) =>
      a.associate.name.localeCompare(b.associate.name, undefined, {
        sensitivity: 'base',
      })
    )

    return sorted[0]
  }

  /**
   * Check if alphabetical tie-breaking is needed
   */
  static needsAlphabetical(associates: AssociateWithWorkload[]): boolean {
    return associates.length > 1
  }
}
