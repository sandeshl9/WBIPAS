/**
 * REPOSITORY LAYER - CapacityHistoryRepository
 * Pure CRUD operations for capacity_history table
 * 
 * IMPORTANT: capacity_history is IMMUTABLE
 * - Only INSERT operations allowed
 * - NO UPDATE or DELETE
 * - Historical data is never modified
 */

import { supabase } from '@/lib/supabase'
import type { CapacityHistory, CapacityHistoryInsert } from '@/types/database-enterprise'

export class CapacityHistoryRepository {
  /**
   * Get all capacity history for an associate
   */
  static async findByAssociate(associateId: string) {
    const { data, error } = await supabase
      .from('capacity_history')
      .select('*')
      .eq('associate_id', associateId)
      .order('effective_from', { ascending: false })

    return { data, error }
  }

  /**
   * Get capacity history for a specific week
   */
  static async findByWeek(associateId: string, weekNumber: number, year: number) {
    const { data, error } = await supabase
      .from('capacity_history')
      .select('*')
      .eq('associate_id', associateId)
      .eq('week_number', weekNumber)
      .eq('year', year)
      .order('effective_from', { ascending: false })

    return { data, error }
  }

  /**
   * Get current (active) capacity for an associate
   */
  static async findCurrent(associateId: string) {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('capacity_history')
      .select('*')
      .eq('associate_id', associateId)
      .lte('effective_from', today)
      .or(`effective_to.is.null,effective_to.gte.${today}`)
      .order('effective_from', { ascending: false })
      .limit(1)
      .single()

    return { data, error }
  }

  /**
   * Insert new capacity history record
   * IMPORTANT: This is the ONLY write operation allowed
   */
  static async create(capacity: CapacityHistoryInsert) {
    const { data, error } = await supabase
      .from('capacity_history')
      .insert(capacity)
      .select()
      .single()

    return { data, error }
  }

  /**
   * Close previous capacity record (set effective_to date)
   */
  static async closePrevious(associateId: string, effectiveTo: string) {
    const { data, error } = await supabase
      .from('capacity_history')
      .update({ effective_to: effectiveTo })
      .eq('associate_id', associateId)
      .is('effective_to', null)
      .neq('effective_from', effectiveTo) // Don't close the new record
      .select()

    return { data, error }
  }

  /**
   * Get capacity history within date range
   */
  static async findByDateRange(
    associateId: string,
    startDate: string,
    endDate: string
  ) {
    const { data, error } = await supabase
      .from('capacity_history')
      .select('*')
      .eq('associate_id', associateId)
      .gte('effective_from', startDate)
      .or(`effective_to.is.null,effective_to.lte.${endDate}`)
      .order('effective_from', { ascending: true })

    return { data, error }
  }
}
