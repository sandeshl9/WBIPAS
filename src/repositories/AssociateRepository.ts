/**
 * REPOSITORY LAYER - AssociateRepository
 * 
 * IMPORTANT: This layer is ONLY responsible for:
 * - CREATE
 * - READ
 * - UPDATE
 * - DELETE
 * 
 * NO business logic here. NO calculations.
 */

import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type AssociateRow = Database['public']['Tables']['associates']['Row']
type AssociateInsert = Database['public']['Tables']['associates']['Insert']
type AssociateUpdate = Database['public']['Tables']['associates']['Update']

export class AssociateRepository {
  /**
   * Get all associates
   */
  static async findAll() {
    const { data, error } = await supabase
      .from('associates')
      .select('*')
      .order('name', { ascending: true })

    return { data, error }
  }

  /**
   * Get associate by ID
   */
  static async findById(id: string) {
    const { data, error } = await supabase
      .from('associates')
      .select('*')
      .eq('id', id)
      .single()

    return { data, error }
  }

  /**
   * Get active and available associates
   */
  static async findActiveAndAvailable() {
    const { data, error } = await supabase
      .from('associates')
      .select('*')
      .eq('is_active', true)
      .eq('is_available', true)
      .order('name', { ascending: true })

    return { data, error }
  }

  /**
   * Create associate
   */
  static async create(associate: AssociateInsert) {
    const { data, error } = await supabase
      .from('associates')
      .insert(associate)
      .select()
      .single()

    return { data, error }
  }

  /**
   * Update associate
   */
  static async update(id: string, updates: AssociateUpdate) {
    const { data, error } = await supabase
      .from('associates')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  }

  /**
   * Delete associate (hard delete)
   */
  static async delete(id: string) {
    const { error } = await supabase.from('associates').delete().eq('id', id)

    return { error }
  }

  /**
   * Soft delete (set is_active = false)
   */
  static async softDelete(id: string) {
    return this.update(id, { is_active: false })
  }

  /**
   * Search associates
   */
  static async search(query: string) {
    const { data, error } = await supabase
      .from('associates')
      .select('*')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,employee_id.ilike.%${query}%`)
      .order('name', { ascending: true })

    return { data, error }
  }

  /**
   * Filter associates by criteria
   */
  static async filter(filters: {
    isActive?: boolean
    isAvailable?: boolean
    department?: string
  }) {
    let query = supabase.from('associates').select('*')

    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive)
    }

    if (filters.isAvailable !== undefined) {
      query = query.eq('is_available', filters.isAvailable)
    }

    if (filters.department) {
      query = query.eq('department', filters.department)
    }

    query = query.order('name', { ascending: true })

    const { data, error } = await query

    return { data, error }
  }
}
