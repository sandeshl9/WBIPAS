/**
 * Projects Service
 * Handles all project-related operations
 */

import { supabase } from '@/lib/supabase'
import type { Project, CreateProjectInput, ProjectFilters, ProjectStatus } from '@/types'
import { createAuditLog } from './auditService'

/**
 * Get all projects with filters
 */
export async function getProjects(filters?: ProjectFilters) {
  try {
    let query = supabase
      .from('projects')
      .select('*')
      .order('project_date', { ascending: false })

    if (filters?.status && filters.status.length > 0) {
      query = query.in('status', filters.status)
    }

    if (filters?.priority && filters.priority.length > 0) {
      query = query.in('priority', filters.priority)
    }

    if (filters?.assigned_associate_id) {
      query = query.eq('assigned_associate_id', filters.assigned_associate_id)
    }

    if (filters?.client) {
      query = query.ilike('client', `%${filters.client}%`)
    }

    if (filters?.week_number) {
      query = query.eq('week_number', filters.week_number)
    }

    if (filters?.year) {
      query = query.eq('year', filters.year)
    }

    if (filters?.date_from) {
      query = query.gte('project_date', filters.date_from)
    }

    if (filters?.date_to) {
      query = query.lte('project_date', filters.date_to)
    }

    if (filters?.search) {
      query = query.or(`project_name.ilike.%${filters.search}%,project_id.ilike.%${filters.search}%,client.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) throw error
    return { data: data as Project[], error: null }
  } catch (error: any) {
    console.error('Error fetching projects:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Get project by ID
 */
export async function getProjectById(id: string) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return { data: data as Project, error: null }
  } catch (error: any) {
    console.error('Error fetching project:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Create a new project
 */
export async function createProject(input: CreateProjectInput) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({
        project_id: input.project_id,
        project_name: input.project_name,
        client: input.client,
        project_date: input.project_date,
        priority: input.priority,
        comments: input.comments,
        created_by: user.id,
        source: 'manual',
      })
      .select()
      .single()

    if (error) throw error

    // Create audit log
    await createAuditLog({
      action: 'create_project',
      entityType: 'project',
      entityId: data.id,
      newValue: data,
    })

    return { data: data as Project, error: null }
  } catch (error: any) {
    console.error('Error creating project:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Update a project
 */
export async function updateProject(id: string, updates: Partial<CreateProjectInput>) {
  try {
    // Get old value for audit
    const { data: oldData } = await getProjectById(id)

    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Create audit log
    await createAuditLog({
      action: 'update_project',
      entityType: 'project',
      entityId: id,
      oldValue: oldData || undefined,
      newValue: data,
    })

    return { data: data as Project, error: null }
  } catch (error: any) {
    console.error('Error updating project:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Update project status
 */
export async function updateProjectStatus(id: string, status: ProjectStatus) {
  try {
    const { data: oldData } = await getProjectById(id)

    const updates: any = { status }
    
    // If completing, set completion date
    if (status === 'completed') {
      updates.completion_date = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Create audit log
    await createAuditLog({
      action: status === 'completed' ? 'complete_project' : 
              status === 'cancelled' ? 'cancel_project' : 
              'update_project',
      entityType: 'project',
      entityId: id,
      oldValue: oldData || undefined,
      newValue: data,
      metadata: { status_change: { from: oldData?.status, to: status } },
    })

    return { data: data as Project, error: null }
  } catch (error: any) {
    console.error('Error updating project status:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Delete a project
 */
export async function deleteProject(id: string) {
  try {
    const { data: oldData } = await getProjectById(id)

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) throw error

    // Create audit log
    await createAuditLog({
      action: 'cancel_project',
      entityType: 'project',
      entityId: id,
      oldValue: oldData || undefined,
    })

    return { data: true, error: null }
  } catch (error: any) {
    console.error('Error deleting project:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Get projects by week
 */
export async function getProjectsByWeek(weekNumber: number, year: number, status?: ProjectStatus[]) {
  try {
    let query = supabase
      .from('projects')
      .select('*')
      .eq('week_number', weekNumber)
      .eq('year', year)
      .order('project_date', { ascending: true })

    if (status && status.length > 0) {
      query = query.in('status', status)
    }

    const { data, error } = await query

    if (error) throw error
    return { data: data as Project[], error: null }
  } catch (error: any) {
    console.error('Error fetching projects by week:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Get projects by associate
 */
export async function getProjectsByAssociate(associateId: string, status?: ProjectStatus[]) {
  try {
    let query = supabase
      .from('projects')
      .select('*')
      .eq('assigned_associate_id', associateId)
      .order('project_date', { ascending: false })

    if (status && status.length > 0) {
      query = query.in('status', status)
    }

    const { data, error } = await query

    if (error) throw error
    return { data: data as Project[], error: null }
  } catch (error: any) {
    console.error('Error fetching projects by associate:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Get project statistics
 */
export async function getProjectStatistics() {
  try {
    const { data: allProjects, error: allError } = await supabase
      .from('projects')
      .select('status', { count: 'exact' })

    if (allError) throw allError

    const { data: activeProjects, error: activeError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'assigned', 'in_progress'])

    if (activeError) throw activeError

    const { data: completedProjects, error: completedError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')

    if (completedError) throw completedError

    return {
      data: {
        total: allProjects?.length || 0,
        active: activeProjects || 0,
        completed: completedProjects || 0,
      },
      error: null,
    }
  } catch (error: any) {
    console.error('Error fetching project statistics:', error)
    return { data: null, error: error.message }
  }
}
