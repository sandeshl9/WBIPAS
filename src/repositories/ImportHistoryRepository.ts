/**
 * REPOSITORY LAYER - ImportHistoryRepository
 * Pure CRUD operations for import_history table
 * 
 * NOTE: Import history is typically INSERT-only (immutable)
 */

import { supabase } from '@/lib/supabase'
import type { ImportHistory, ImportHistoryInsert, ImportType } from '@/types/database-enterprise'

export class ImportHistoryRepository {
  /**
   * Get all import history
   */
  static async findAll() {
    const { data, error } = await supabase
      .from('import_history')
      .select('*')
      .order('created_at', { ascending: false })

    return { data, error }
  }

  /**
   * Get import history by type
   */
  static async findByType(importType: ImportType) {
    const { data, error } = await supabase
      .from('import_history')
      .select('*')
      .eq('import_type', importType)
      .order('created_at', { ascending: false })

    return { data, error }
  }

  /**
   * Get import history by user
   */
  static async findByUser(userId: string) {
    const { data, error } = await supabase
      .from('import_history')
      .select('*')
      .eq('imported_by', userId)
      .order('created_at', { ascending: false })

    return { data, error }
  }

  /**
   * Get recent imports
   */
  static async findRecent(limit: number = 20) {
    const { data, error } = await supabase
      .from('import_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    return { data, error }
  }

  /**
   * Get import by ID
   */
  static async findById(id: string) {
    const { data, error } = await supabase
      .from('import_history')
      .select('*')
      .eq('id', id)
      .single()

    return { data, error }
  }

  /**
   * Create import history record
   */
  static async create(importRecord: ImportHistoryInsert) {
    const { data, error } = await supabase
      .from('import_history')
      .insert(importRecord)
      .select()
      .single()

    return { data, error }
  }

  /**
   * Get import statistics
   */
  static async getStatistics() {
    const { data, error } = await supabase
      .from('import_history')
      .select('import_type, records, success_count, failed_count')

    if (error) return { data: null, error }

    // Calculate statistics per import type
    const stats = data?.reduce((acc, record) => {
      const type = record.import_type
      if (!acc[type]) {
        acc[type] = {
          total_imports: 0,
          total_records: 0,
          total_success: 0,
          total_failed: 0,
        }
      }
      acc[type].total_imports++
      acc[type].total_records += record.records || 0
      acc[type].total_success += record.success_count || 0
      acc[type].total_failed += record.failed_count || 0
      return acc
    }, {} as Record<string, any>)

    return { data: stats, error: null }
  }
}
