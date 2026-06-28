/**
 * REPOSITORY LAYER - ProfileRepository
 * Pure CRUD operations for profiles table
 */

import { supabase } from '@/lib/supabase'
import type { Profile, ProfileInsert, ProfileUpdate } from '@/types/database-enterprise'

export class ProfileRepository {
  /**
   * Get all profiles
   */
  static async findAll() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true })

    return { data, error }
  }

  /**
   * Get profile by ID
   */
  static async findById(id: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    return { data, error }
  }

  /**
   * Get profile by email
   */
  static async findByEmail(email: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single()

    return { data, error }
  }

  /**
   * Get active profiles by role
   */
  static async findByRole(role: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', role)
      .eq('is_active', true)
      .order('full_name', { ascending: true })

    return { data, error }
  }

  /**
   * Create profile
   */
  static async create(profile: ProfileInsert) {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profile)
      .select()
      .single()

    return { data, error }
  }

  /**
   * Update profile
   */
  static async update(id: string, updates: ProfileUpdate) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  }

  /**
   * Soft delete (set is_active = false)
   */
  static async softDelete(id: string) {
    return this.update(id, { is_active: false })
  }

  /**
   * Restore soft-deleted profile
   */
  static async restore(id: string) {
    return this.update(id, { is_active: true })
  }
}
