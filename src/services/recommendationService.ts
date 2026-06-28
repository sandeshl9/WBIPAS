/**
 * Recommendation Engine Service
 * Implements the 11-step deterministic recommendation algorithm
 */

import { supabase } from '@/lib/supabase'
import type { Associate, RecommendationResult } from '@/types'
import { getWeekNumber, getYear } from '@/lib/utils'

/**
 * Step 1-11: Complete Recommendation Engine
 * This function implements the exact business rules from the PRD
 */
export async function getRecommendation(projectDate: string): Promise<{
  data: RecommendationResult | null
  error: string | null
}> {
  try {
    // Step 1: Determine project week
    const weekNumber = getWeekNumber(new Date(projectDate))
    const year = getYear(new Date(projectDate))

    // Step 2: Filter associates who are active and available
    const { data: associates, error: associatesError } = await supabase
      .from('associates')
      .select('*')
      .eq('is_active', true)
      .eq('is_available', true)

    if (associatesError) throw associatesError
    if (!associates || associates.length === 0) {
      return {
        data: null,
        error: 'No available associates found',
      }
    }

    // Step 3: Exclude associates whose assigned project count >= weekly capacity
    const eligibleAssociates: Associate[] = []
    
    for (const associate of associates) {
      const { data: hasCapacity } = await supabase.rpc('has_capacity', {
        p_associate_id: associate.id,
        p_week_number: weekNumber,
        p_year: year,
      })

      if (hasCapacity) {
        eligibleAssociates.push(associate as Associate)
      }
    }

    if (eligibleAssociates.length === 0) {
      return {
        data: null,
        error: 'No associates with available capacity found for this week',
      }
    }

    // Step 4: Calculate active workload for each eligible associate
    const associatesWithWorkload = await Promise.all(
      eligibleAssociates.map(async (associate) => {
        const { data: workload } = await supabase.rpc('get_associate_workload', {
          p_associate_id: associate.id,
          p_week_number: weekNumber,
          p_year: year,
        })

        return {
          associate,
          workload: workload || 0,
        }
      })
    )

    // Step 5: Select associates with the lowest workload
    const minWorkload = Math.min(...associatesWithWorkload.map(a => a.workload))
    const candidatesWithLowestWorkload = associatesWithWorkload.filter(
      a => a.workload === minWorkload
    )

    // If only one candidate, return it
    if (candidatesWithLowestWorkload.length === 1) {
      const candidate = candidatesWithLowestWorkload[0]
      return {
        data: {
          associate: candidate.associate,
          workload_before: candidate.workload,
          workload_after: candidate.workload + 1,
          explanation: generateExplanation(
            candidate.associate,
            candidate.workload,
            'lowest_workload',
            eligibleAssociates.length,
            candidatesWithLowestWorkload.length
          ),
          reason: 'lowest_workload',
        },
        error: null,
      }
    }

    // Step 6: If multiple associates share the same workload, compare oldest active project date
    const candidatesWithOldestProject = await Promise.all(
      candidatesWithLowestWorkload.map(async (candidate) => {
        const { data: oldestDate } = await supabase.rpc('get_oldest_project_date', {
          p_associate_id: candidate.associate.id,
        })

        return {
          ...candidate,
          oldestProjectDate: oldestDate ? new Date(oldestDate) : new Date(),
        }
      })
    )

    // Find the earliest (oldest) project date
    const oldestDate = new Date(
      Math.min(...candidatesWithOldestProject.map(c => c.oldestProjectDate.getTime()))
    )

    const candidatesWithOldest = candidatesWithOldestProject.filter(
      c => c.oldestProjectDate.getTime() === oldestDate.getTime()
    )

    // If only one candidate after FIFO, return it
    if (candidatesWithOldest.length === 1) {
      const candidate = candidatesWithOldest[0]
      return {
        data: {
          associate: candidate.associate,
          workload_before: candidate.workload,
          workload_after: candidate.workload + 1,
          explanation: generateExplanation(
            candidate.associate,
            candidate.workload,
            'fifo',
            eligibleAssociates.length,
            candidatesWithLowestWorkload.length
          ),
          reason: 'fifo',
        },
        error: null,
      }
    }

    // Step 7: If still tied, sort alphabetically
    const sortedCandidates = candidatesWithOldest.sort((a, b) =>
      a.associate.name.localeCompare(b.associate.name)
    )

    const winner = sortedCandidates[0]

    return {
      data: {
        associate: winner.associate,
        workload_before: winner.workload,
        workload_after: winner.workload + 1,
        explanation: generateExplanation(
          winner.associate,
          winner.workload,
          'alphabetical',
          eligibleAssociates.length,
          candidatesWithLowestWorkload.length
        ),
        reason: 'alphabetical',
      },
      error: null,
    }
  } catch (error: any) {
    console.error('Error generating recommendation:', error)
    return {
      data: null,
      error: error.message || 'Failed to generate recommendation',
    }
  }
}

/**
 * Generate human-readable explanation for the recommendation
 */
function generateExplanation(
  associate: Associate,
  currentWorkload: number,
  reason: string,
  totalEligible: number,
  tiedCandidates: number
): string {
  const baseExplanation = `${associate.name} was recommended because:`

  const parts: string[] = [baseExplanation]

  parts.push(`• They are active and available`)
  parts.push(`• Current workload: ${currentWorkload} projects`)
  parts.push(`• Available capacity remaining`)

  if (reason === 'lowest_workload') {
    if (tiedCandidates === totalEligible) {
      parts.push(`• All ${totalEligible} eligible associates have the same workload`)
    } else {
      parts.push(`• Lowest workload among ${totalEligible} eligible associates`)
    }
  }

  if (reason === 'fifo') {
    parts.push(`• Among ${tiedCandidates} associates with equal workload`)
    parts.push(`• Has the oldest active project (FIFO rule)`)
  }

  if (reason === 'alphabetical') {
    parts.push(`• Among ${tiedCandidates} associates with equal workload and FIFO date`)
    parts.push(`• Selected alphabetically (tie-breaker)`)
  }

  return parts.join('\n')
}

/**
 * Save recommendation to database
 */
export async function saveRecommendation(
  projectId: string,
  recommendation: RecommendationResult,
  wasAccepted: boolean,
  actualAssignedAssociateId?: string
) {
  try {
    const { data, error } = await supabase
      .from('recommendations')
      .insert({
        project_id: projectId,
        recommended_associate_id: recommendation.associate.id,
        recommended_associate_name: recommendation.associate.name,
        workload_before: recommendation.workload_before,
        workload_after: recommendation.workload_after,
        explanation: recommendation.explanation,
        was_accepted: wasAccepted,
        actual_assigned_associate_id: actualAssignedAssociateId,
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    console.error('Error saving recommendation:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Get recommendation history for a project
 */
export async function getProjectRecommendations(projectId: string) {
  try {
    const { data, error } = await supabase
      .from('recommendations')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    console.error('Error fetching project recommendations:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Get recommendation accuracy statistics
 */
export async function getRecommendationAccuracy() {
  try {
    const { data: allRecommendations, error: allError } = await supabase
      .from('recommendations')
      .select('was_accepted', { count: 'exact' })

    if (allError) throw allError

    const { data: acceptedRecommendations, error: acceptedError } = await supabase
      .from('recommendations')
      .select('*', { count: 'exact', head: true })
      .eq('was_accepted', true)

    if (acceptedError) throw acceptedError

    const total = allRecommendations?.length || 0
    const accepted = acceptedRecommendations || 0
    const accuracy = total > 0 ? (accepted / total) * 100 : 0

    return {
      data: {
        total,
        accepted,
        overridden: total - accepted,
        accuracy: Math.round(accuracy * 100) / 100,
      },
      error: null,
    }
  } catch (error: any) {
    console.error('Error fetching recommendation accuracy:', error)
    return { data: null, error: error.message }
  }
}
