/**
 * Audit Service
 * Handles all audit logging operations
 */

import { supabase } from '@/lib/supabase'
import type { AuditLog, AuditAction } from '@/types'

/**
 * Create an audit log entry
 */
export async function createAuditLog(params: {
  action: AuditAction
  entityType: string
  entityId?: string
  oldValue?: Record<string, any>
  newValue?: Record<string, any>
  metadata?: Record<string, any>
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        user_email: user.email!,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId,
        old_value: params.oldValue,
        new_value: params.newValue,
        metadata: params.metadata,
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    console.error('Error creating audit log:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Get audit logs with filters
 */
export async function getAuditLogs(params?: {
  userId?: string
  action?: AuditAction
  entityType?: string
  entityId?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}) {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (params?.userId) {
      query = query.eq('user_id', params.userId)
    }

    if (params?.action) {
      query = query.eq('action', params.action)
    }

    if (params?.entityType) {
      query = query.eq('entity_type', params.entityType)
    }

    if (params?.entityId) {
      query = query.eq('entity_id', params.entityId)
    }

    if (params?.startDate) {
      query = query.gte('created_at', params.startDate)
    }

    if (params?.endDate) {
      query = query.lte('created_at', params.endDate)
    }

    if (params?.limit) {
      query = query.limit(params.limit)
    }

    if (params?.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 50) - 1)
    }

    const { data, error, count } = await query

    if (error) throw error
    return { data: data as AuditLog[], count, error: null }
  } catch (error: any) {
    console.error('Error fetching audit logs:', error)
    return { data: null, count: 0, error: error.message }
  }
}

/**
 * Get audit log by ID
 */
export async function getAuditLogById(id: string) {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return { data: data as AuditLog, error: null }
  } catch (error: any) {
    console.error('Error fetching audit log:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Get audit logs for a specific entity
 */
export async function getEntityAuditHistory(entityType: string, entityId: string) {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data as AuditLog[], error: null }
  } catch (error: any) {
    console.error('Error fetching entity audit history:', error)
    return { data: null, error: error.message }
  }
}
