/**
 * REPOSITORY LAYER - HolidayRepository
 * Pure CRUD operations for holidays table
 */

import { supabase } from '@/lib/supabase'
import type { Holiday, HolidayInsert, HolidayUpdate } from '@/types/database-enterprise'

export class HolidayRepository {
  /**
   * Get all holidays
   */
  static async findAll() {
    const { data, error } = await supabase
      .from('holidays')
      .select('*')
      .order('holiday_date', { ascending: true })

    return { data, error }
  }

  /**
   * Get holidays by country
   */
  static async findByCountry(country: string) {
    const { data, error } = await supabase
      .from('holidays')
      .select('*')
      .eq('country', country)
      .order('holiday_date', { ascending: true })

    return { data, error }
  }

  /**
   * Get holidays by country and state
   */
  static async findByCountryAndState(country: string, state: string) {
    const { data, error } = await supabase
      .from('holidays')
      .select('*')
      .eq('country', country)
      .eq('state', state)
      .order('holiday_date', { ascending: true })

    return { data, error }
  }

  /**
   * Get holidays within date range
   */
  static async findByDateRange(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('holidays')
      .select('*')
      .gte('holiday_date', startDate)
      .lte('holiday_date', endDate)
      .order('holiday_date', { ascending: true })

    return { data, error }
  }

  /**
   * Get upcoming holidays (from today)
   */
  static async findUpcoming(limit: number = 10) {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('holidays')
      .select('*')
      .gte('holiday_date', today)
      .order('holiday_date', { ascending: true })
      .limit(limit)

    return { data, error }
  }

  /**
   * Create holiday
   */
  static async create(holiday: HolidayInsert) {
    const { data, error } = await supabase
      .from('holidays')
      .insert(holiday)
      .select()
      .single()

    return { data, error }
  }

  /**
   * Update holiday
   */
  static async update(id: string, updates: HolidayUpdate) {
    const { data, error } = await supabase
      .from('holidays')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  }

  /**
   * Delete holiday
   */
  static async delete(id: string) {
    const { error } = await supabase
      .from('holidays')
      .delete()
      .eq('id', id)

    return { error }
  }

  /**
   * Bulk create holidays
   */
  static async createBulk(holidays: HolidayInsert[]) {
    const { data, error } = await supabase
      .from('holidays')
      .insert(holidays)
      .select()

    return { data, error }
  }
}
