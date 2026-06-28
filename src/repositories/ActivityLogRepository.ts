/**
 * REPOSITORY LAYER - ActivityLogRepository
 * Pure CRUD operations for activity_logs table
 * 
 * NOTE: Activity logs are typically INSERT-only (immutable)
 */

import { supabase } from '@/lib/supabase'
import type { ActivityLog, ActivityLogInsert } from '@/types/database-enterprise'

export class ActivityLogRepository {
  /**
   * Get recent activity logs
   */
  static async findRecent(limit: number = 50) {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    return { data, error }
  }

  /**
   * Get activity logs by entity
   */
  static async findByEntity(entity: string, entityId: string) {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('entity', entity)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })

    return { data, error }
  }

  /**
   * Get activity logs within date range
   */
  static async findByDateRange(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false })

    return { data, error }
  }

  /**
   * Get today's activity
   */
  static async findToday() {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .gte('created_at', today)
      .order('created_at', { ascending: false })

    return { data, error }
  }

  /**
   * Create activity log
   */
  static async create(log: ActivityLogInsert) {
    const { data, error } = await supabase
      .from('activity_logs')
      .insert(log)
      .select()
      .single()

    return { data, error }
  }

  /**
   * Create multiple activity logs (bulk)
   */
  static async createBulk(logs: ActivityLogInsert[]) {
    const { data, error } = await supabase
      .from('activity_logs')
      .insert(logs)
      .select()

    return { data, error }
  }

  /**
   * Use database function to get recent activity
   */
  static async getRecentActivity(limit: number = 10) {
    const { data, error } = await supabase
      .rpc('get_recent_activity', { p_limit: limit })

    return { data, error }
  }
}
