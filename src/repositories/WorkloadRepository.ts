/**
 * REPOSITORY LAYER - WorkloadRepository
 * 
 * Retrieves raw workload data from database.
 * Calculations are done in the Domain Layer.
 */

import { supabase } from '@/lib/supabase'

export interface RawWorkloadData {
  associateId: string
  activeProjectCount: number
  openingBalanceCount: number
  completedProjectCount: number
  cancelledProjectCount: number
  oldestProjectDate: string | null
}

export class WorkloadRepository {
  /**
   * Get workload data for a specific week
   */
  static async getWorkloadForWeek(
    weekNumber: number,
    year: number
  ): Promise<{ data: RawWorkloadData[] | null; error: any }> {
    try {
      // Get active projects per associate
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('assigned_associate_id, status, project_date')
        .eq('week_number', weekNumber)
        .eq('year', year)
        .not('assigned_associate_id', 'is', null)

      if (projectsError) throw projectsError

      // Get opening balance per associate
      const { data: openingBalance, error: obError } = await supabase
        .from('opening_balance')
        .select('assigned_associate_id, project_date')
        .eq('week_number', weekNumber)
        .eq('year', year)

      if (obError) throw obError

      // Aggregate by associate
      const workloadMap = new Map<string, RawWorkloadData>()

      // Process projects
      projects?.forEach((p) => {
        if (!p.assigned_associate_id) return

        const existing = workloadMap.get(p.assigned_associate_id) || {
          associateId: p.assigned_associate_id,
          activeProjectCount: 0,
          openingBalanceCount: 0,
          completedProjectCount: 0,
          cancelledProjectCount: 0,
          oldestProjectDate: null,
        }

        if (p.status === 'completed') {
          existing.completedProjectCount++
        } else if (p.status === 'cancelled') {
          existing.cancelledProjectCount++
        } else {
          existing.activeProjectCount++
        }

        // Track oldest project date
        if (p.project_date) {
          if (
            !existing.oldestProjectDate ||
            new Date(p.project_date) < new Date(existing.oldestProjectDate)
          ) {
            existing.oldestProjectDate = p.project_date
          }
        }

        workloadMap.set(p.assigned_associate_id, existing)
      })

      // Process opening balance
      openingBalance?.forEach((ob) => {
        const existing = workloadMap.get(ob.assigned_associate_id) || {
          associateId: ob.assigned_associate_id,
          activeProjectCount: 0,
          openingBalanceCount: 0,
          completedProjectCount: 0,
          cancelledProjectCount: 0,
          oldestProjectDate: null,
        }

        existing.openingBalanceCount++

        // Track oldest project date
        if (ob.project_date) {
          if (
            !existing.oldestProjectDate ||
            new Date(ob.project_date) < new Date(existing.oldestProjectDate)
          ) {
            existing.oldestProjectDate = ob.project_date
          }
        }

        workloadMap.set(ob.assigned_associate_id, existing)
      })

      return { data: Array.from(workloadMap.values()), error: null }
    } catch (error: any) {
      console.error('Error fetching workload data:', error)
      return { data: null, error: error.message }
    }
  }

  /**
   * Get current workload for all associates
   */
  static async getCurrentWorkload(): Promise<{
    data: RawWorkloadData[] | null
    error: any
  }> {
    try {
      // Use the database view
      const { data, error } = await supabase
        .from('v_associates_with_workload')
        .select('id, current_workload, available_capacity')

      if (error) throw error

      const workloadData: RawWorkloadData[] =
        data?.map((row) => ({
          associateId: row.id,
          activeProjectCount: row.current_workload || 0,
          openingBalanceCount: 0, // Included in current_workload from view
          completedProjectCount: 0,
          cancelledProjectCount: 0,
          oldestProjectDate: null,
        })) || []

      return { data: workloadData, error: null }
    } catch (error: any) {
      console.error('Error fetching current workload:', error)
      return { data: null, error: error.message }
    }
  }

  /**
   * Get oldest project date for an associate
   */
  static async getOldestProjectDate(
    associateId: string
  ): Promise<{ data: Date | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc('get_oldest_project_date', {
        p_associate_id: associateId,
      })

      if (error) throw error

      return { data: data ? new Date(data) : null, error: null }
    } catch (error: any) {
      console.error('Error fetching oldest project date:', error)
      return { data: null, error: error.message }
    }
  }
}
