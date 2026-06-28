/**
 * Associates Service
 * Handles all associate-related operations
 */

import { supabase } from '@/lib/supabase'
import type { Associate, AssociateWithWorkload, CreateAssociateInput, UpdateAssociateInput, AssociateFilters } from '@/types'
import { createAuditLog } from './auditService'

/**
 * Get all associates
 */
export async function getAssociates(filters?: AssociateFilters) {
  try {
    let query = supabase
      .from('associates')
      .select('*')
      .order('name', { ascending: true })

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    if (filters?.is_available !== undefined) {
      query = query.eq('is_available', filters.is_available)
    }

    if (filters?.department) {
      query = query.eq('department', filters.department)
    }

    if (filters?.min_capacity) {
      query = query.gte('weekly_capacity', filters.min_capacity)
    }

    if (filters?.max_capacity) {
      query = query.lte('weekly_capacity', filters.max_capacity)
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,employee_id.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) throw error
    return { data: data as Associate[], error: null }
  } catch (error: any) {
    console.error('Error fetching associates:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Get associates with workload information
 */
export async function getAssociatesWithWorkload(filters?: AssociateFilters) {
  try {
    let query = supabase
      .from('v_associates_with_workload')
      .select('*')
      .order('name', { ascending: true })

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    if (filters?.is_available !== undefined) {
      query = query.eq('is_available', filters.is_available)
    }

    if (filters?.department) {
      query = query.eq('department', filters.department)
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,employee_id.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) throw error
    return { data: data as AssociateWithWorkload[], error: null }
  } catch (error: any) {
    console.error('Error fetching associates with workload:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Get associate by ID
 */
export async function getAssociateById(id: string) {
  try {
    const { data, error } = await supabase
      .from('associates')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return { data: data as Associate, error: null }
  } catch (error: any) {
    console.error('Error fetching associate:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Create a new associate
 */
export async function createAssociate(input: CreateAssociateInput) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('associates')
      .insert({
        employee_id: input.employee_id,
        name: input.name,
        email: input.email,
        weekly_capacity: input.weekly_capacity,
        department: input.department,
        skills: input.skills,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    // Create audit log
    await createAuditLog({
      action: 'create_associate',
      entityType: 'associate',
      entityId: data.id,
      newValue: data,
    })

    return { data: data as Associate, error: null }
  } catch (error: any) {
    console.error('Error creating associate:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Update an associate
 */
export async function updateAssociate(id: string, input: UpdateAssociateInput) {
  try {
    // Get old value for audit
    const { data: oldData } = await getAssociateById(id)

    const { data, error } = await supabase
      .from('associates')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Create audit log
    await createAuditLog({
      action: 'update_associate',
      entityType: 'associate',
      entityId: id,
      oldValue: oldData || undefined,
      newValue: data,
    })

    return { data: data as Associate, error: null }
  } catch (error: any) {
    console.error('Error updating associate:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Delete an associate (soft delete by setting is_active to false)
 */
export async function deleteAssociate(id: string) {
  try {
    const { data: oldData } = await getAssociateById(id)

    const { data, error } = await supabase
      .from('associates')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Create audit log
    await createAuditLog({
      action: 'delete_associate',
      entityType: 'associate',
      entityId: id,
      oldValue: oldData || undefined,
      newValue: data,
    })

    return { data: data as Associate, error: null }
  } catch (error: any) {
    console.error('Error deleting associate:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Toggle associate availability
 */
export async function toggleAssociateAvailability(id: string, isAvailable: boolean) {
  try {
    const { data: oldData } = await getAssociateById(id)

    const { data, error } = await supabase
      .from('associates')
      .update({ is_available: isAvailable })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Create audit log
    await createAuditLog({
      action: 'update_associate',
      entityType: 'associate',
      entityId: id,
      oldValue: oldData || undefined,
      newValue: data,
      metadata: { field_changed: 'is_available', new_value: isAvailable },
    })

    return { data: data as Associate, error: null }
  } catch (error: any) {
    console.error('Error toggling associate availability:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Update associate capacity
 */
export async function updateAssociateCapacity(id: string, weeklyCapacity: number) {
  try {
    const { data: oldData } = await getAssociateById(id)

    const { data, error } = await supabase
      .from('associates')
      .update({ weekly_capacity: weeklyCapacity })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Create audit log
    await createAuditLog({
      action: 'update_capacity',
      entityType: 'associate',
      entityId: id,
      oldValue: oldData || undefined,
      newValue: data,
      metadata: { 
        field_changed: 'weekly_capacity', 
        old_capacity: oldData?.weekly_capacity,
        new_capacity: weeklyCapacity 
      },
    })

    return { data: data as Associate, error: null }
  } catch (error: any) {
    console.error('Error updating associate capacity:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Get associate workload for a specific week
 */
export async function getAssociateWorkload(
  associateId: string,
  weekNumber: number,
  year: number
) {
  try {
    const { data, error } = await supabase
      .rpc('get_associate_workload', {
        p_associate_id: associateId,
        p_week_number: weekNumber,
        p_year: year,
      })

    if (error) throw error
    return { data: data as number, error: null }
  } catch (error: any) {
    console.error('Error getting associate workload:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Get associate capacity for a specific week
 */
export async function getAssociateCapacity(
  associateId: string,
  weekNumber: number,
  year: number
) {
  try {
    const { data, error } = await supabase
      .rpc('get_associate_capacity', {
        p_associate_id: associateId,
        p_week_number: weekNumber,
        p_year: year,
      })

    if (error) throw error
    return { data: data as number, error: null }
  } catch (error: any) {
    console.error('Error getting associate capacity:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Check if associate has capacity for a specific week
 */
export async function checkAssociateCapacity(
  associateId: string,
  weekNumber: number,
  year: number
) {
  try {
    const { data, error } = await supabase
      .rpc('has_capacity', {
        p_associate_id: associateId,
        p_week_number: weekNumber,
        p_year: year,
      })

    if (error) throw error
    return { data: data as boolean, error: null }
  } catch (error: any) {
    console.error('Error checking associate capacity:', error)
    return { data: null, error: error.message }
  }
}
