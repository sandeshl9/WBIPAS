/**
 * REPOSITORY LAYER - ProjectRepository
 * 
 * Pure CRUD operations for projects.
 * NO business logic. NO calculations.
 */

import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type ProjectRow = Database['public']['Tables']['projects']['Row']
type ProjectInsert = Database['public']['Tables']['projects']['Insert']
type ProjectUpdate = Database['public']['Tables']['projects']['Update']

export class ProjectRepository {
  /**
   * Get all projects
   */
  static async findAll() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('project_date', { ascending: false })

    return { data, error }
  }

  /**
   * Get project by ID
   */
  static async findById(id: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    return { data, error }
  }

  /**
   * Get projects by status
   */
  static async findByStatus(status: string | string[]) {
    const statuses = Array.isArray(status) ? status : [status]
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .in('status', statuses)
      .order('project_date', { ascending: false })

    return { data, error }
  }

  /**
   * Get projects by week
   */
  static async findByWeek(weekNumber: number, year: number) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('week_number', weekNumber)
      .eq('year', year)
      .order('project_date', { ascending: true })

    return { data, error }
  }

  /**
   * Get projects by associate
   */
  static async findByAssociate(associateId: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('assigned_associate_id', associateId)
      .order('project_date', { ascending: false })

    return { data, error }
  }

  /**
   * Create project
   */
  static async create(project: ProjectInsert) {
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single()

    return { data, error }
  }

  /**
   * Update project
   */
  static async update(id: string, updates: ProjectUpdate) {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  }

  /**
   * Delete project
   */
  static async delete(id: string) {
    const { error } = await supabase.from('projects').delete().eq('id', id)

    return { error }
  }

  /**
   * Get active projects (not completed or cancelled)
   */
  static async findActive() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .not('status', 'in', '(completed,cancelled)')
      .order('project_date', { ascending: false })

    return { data, error }
  }

  /**
   * Count projects by status
   */
  static async countByStatus() {
    const { data, error } = await supabase
      .from('projects')
      .select('status', { count: 'exact' })

    return { data, error }
  }

  /**
   * Search projects
   */
  static async search(query: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .or(
        `project_name.ilike.%${query}%,project_id.ilike.%${query}%,client.ilike.%${query}%`
      )
      .order('project_date', { ascending: false })

    return { data, error }
  }
}
