/**
 * REPOSITORY LAYER - RecommendationLogRepository
 * Pure CRUD operations for recommendation_logs table
 */

import { supabase } from '@/lib/supabase'
import type { RecommendationLog, RecommendationLogInsert, RecommendationLogUpdate } from '@/types/database-enterprise'

export class RecommendationLogRepository {
  /**
   * Get all recommendation logs
   */
  static async findAll() {
    const { data, error } = await supabase
      .from('recommendation_logs')
      .select('*')
      .order('created_at', { ascending: false })

    return { data, error }
  }

  /**
   * Get recommendation by project ID
   */
  static async findByProject(projectId: string) {
    const { data, error } = await supabase
      .from('recommendation_logs')
      .select('*')
      .eq('project_id', projectId)
      .order('recommended_rank', { ascending: true })

    return { data, error }
  }

  /**
   * Get top recommendation for a project
   */
  static async findTopRecommendation(projectId: string) {
    const { data, error } = await supabase
      .from('recommendation_logs')
      .select('*')
      .eq('project_id', projectId)
      .eq('recommended_rank', 1)
      .single()

    return { data, error }
  }

  /**
   * Get recommendations by associate
   */
  static async findByAssociate(associateId: string) {
    const { data, error } = await supabase
      .from('recommendation_logs')
      .select('*')
      .eq('recommended_associate', associateId)
      .order('created_at', { ascending: false })

    return { data, error }
  }

  /**
   * Get accepted recommendations
   */
  static async findAccepted() {
    const { data, error } = await supabase
      .from('recommendation_logs')
      .select('*')
      .eq('accepted', true)
      .order('created_at', { ascending: false })

    return { data, error }
  }

  /**
   * Get recommendation acceptance rate
   */
  static async getAcceptanceRate() {
    const { data, error } = await supabase
      .from('recommendation_logs')
      .select('accepted')

    if (error) return { rate: 0, error }

    const total = data?.length || 0
    const accepted = data?.filter(r => r.accepted).length || 0
    const rate = total > 0 ? (accepted / total) * 100 : 0

    return { rate, error: null }
  }

  /**
   * Get recommendations by algorithm version
   */
  static async findByAlgorithm(version: string) {
    const { data, error } = await supabase
      .from('recommendation_logs')
      .select('*')
      .eq('algorithm_version', version)
      .order('created_at', { ascending: false })

    return { data, error }
  }

  /**
   * Create recommendation log
   */
  static async create(log: RecommendationLogInsert) {
    const { data, error } = await supabase
      .from('recommendation_logs')
      .insert(log)
      .select()
      .single()

    return { data, error }
  }

  /**
   * Create multiple recommendation logs (for multi-candidate recommendations)
   */
  static async createBulk(logs: RecommendationLogInsert[]) {
    const { data, error } = await supabase
      .from('recommendation_logs')
      .insert(logs)
      .select()

    return { data, error }
  }

  /**
   * Update recommendation (typically to mark as accepted)
   */
  static async update(id: string, updates: RecommendationLogUpdate) {
    const { data, error } = await supabase
      .from('recommendation_logs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  }

  /**
   * Mark recommendation as accepted
   */
  static async markAsAccepted(id: string) {
    return this.update(id, { accepted: true })
  }
}
