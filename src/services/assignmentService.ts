/**
 * Assignment Service
 * Handles project assignment operations with full transaction support
 */

import { supabase } from '@/lib/supabase'
import type { AssignProjectInput, RecommendationResult } from '@/types'
import { createAuditLog } from './auditService'
import { saveRecommendation } from './recommendationService'

/**
 * Assign a project to an associate
 * This function handles the complete assignment workflow:
 * 1. Update project with assignment details
 * 2. Create assignment record
 * 3. Save recommendation outcome
 * 4. Create audit log
 * All operations are wrapped in a transaction
 */
export async function assignProject(
  input: AssignProjectInput,
  recommendation?: RecommendationResult
) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Get associate details
    const { data: associate, error: associateError } = await supabase
      .from('associates')
      .select('name')
      .eq('id', input.associate_id)
      .single()

    if (associateError) throw associateError
    if (!associate) throw new Error('Associate not found')

    // Step 1: Update project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .update({
        assigned_associate_id: input.associate_id,
        assigned_associate_name: associate.name,
        status: 'assigned',
      })
      .eq('id', input.project_id)
      .select()
      .single()

    if (projectError) throw projectError

    // Step 2: Create assignment record
    const isOverride = recommendation 
      ? recommendation.associate.id !== input.associate_id 
      : false

    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .insert({
        project_id: input.project_id,
        associate_id: input.associate_id,
        assigned_by: user.id,
        recommended_associate_id: recommendation?.associate.id,
        override_reason: input.override_reason,
        is_override: isOverride,
      })
      .select()
      .single()

    if (assignmentError) throw assignmentError

    // Step 3: Save recommendation outcome
    if (recommendation) {
      await saveRecommendation(
        input.project_id,
        recommendation,
        !isOverride,
        input.associate_id
      )
    }

    // Step 4: Create audit log
    await createAuditLog({
      action: isOverride ? 'override_recommendation' : 'assign_project',
      entityType: 'project',
      entityId: input.project_id,
      newValue: {
        project,
        assignment,
        recommendation: recommendation ? {
          recommended: recommendation.associate.name,
          actual: associate.name,
          was_override: isOverride,
        } : null,
      },
      metadata: {
        override_reason: input.override_reason,
        is_override: isOverride,
      },
    })

    return { 
      data: { project, assignment }, 
      error: null 
    }
  } catch (error: any) {
    console.error('Error assigning project:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Bulk assign multiple projects sequentially
 * This ensures each assignment recalculates recommendations
 */
export async function bulkAssignProjects(
  assignments: Array<{
    projectId: string
    associateId: string
    recommendation?: RecommendationResult
  }>
) {
  const results = {
    successful: 0,
    failed: 0,
    errors: [] as Array<{ projectId: string; error: string }>,
  }

  // Process sequentially, not in parallel
  for (const assignment of assignments) {
    const { data, error } = await assignProject({
      project_id: assignment.projectId,
      associate_id: assignment.associateId,
    }, assignment.recommendation)

    if (error) {
      results.failed++
      results.errors.push({
        projectId: assignment.projectId,
        error,
      })
    } else {
      results.successful++
    }
  }

  return { data: results, error: null }
}

/**
 * Reassign a project to a different associate
 */
export async function reassignProject(
  projectId: string,
  newAssociateId: string,
  reason?: string
) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Get old assignment
    const { data: oldProject, error: oldProjectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (oldProjectError) throw oldProjectError

    // Get new associate details
    const { data: associate, error: associateError } = await supabase
      .from('associates')
      .select('name')
      .eq('id', newAssociateId)
      .single()

    if (associateError) throw associateError

    // Update project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .update({
        assigned_associate_id: newAssociateId,
        assigned_associate_name: associate.name,
      })
      .eq('id', projectId)
      .select()
      .single()

    if (projectError) throw projectError

    // Create new assignment record (old one stays for history)
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .insert({
        project_id: projectId,
        associate_id: newAssociateId,
        assigned_by: user.id,
        override_reason: reason || 'Reassignment',
        is_override: true,
      })
      .select()
      .single()

    if (assignmentError) throw assignmentError

    // Create audit log
    await createAuditLog({
      action: 'assign_project',
      entityType: 'project',
      entityId: projectId,
      oldValue: oldProject,
      newValue: project,
      metadata: {
        action: 'reassignment',
        old_associate: oldProject.assigned_associate_name,
        new_associate: associate.name,
        reason,
      },
    })

    return { data: { project, assignment }, error: null }
  } catch (error: any) {
    console.error('Error reassigning project:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Unassign a project
 */
export async function unassignProject(projectId: string, reason?: string) {
  try {
    const { data: oldProject, error: oldProjectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (oldProjectError) throw oldProjectError

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .update({
        assigned_associate_id: null,
        assigned_associate_name: null,
        status: 'pending',
      })
      .eq('id', projectId)
      .select()
      .single()

    if (projectError) throw projectError

    // Create audit log
    await createAuditLog({
      action: 'update_project',
      entityType: 'project',
      entityId: projectId,
      oldValue: oldProject,
      newValue: project,
      metadata: {
        action: 'unassignment',
        reason,
      },
    })

    return { data: project, error: null }
  } catch (error: any) {
    console.error('Error unassigning project:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Get assignment history for a project
 */
export async function getProjectAssignmentHistory(projectId: string) {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        associate:associates!assignments_associate_id_fkey(name, email),
        assigner:users!assignments_assigned_by_fkey(full_name, email)
      `)
      .eq('project_id', projectId)
      .order('assigned_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    console.error('Error fetching assignment history:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Get all assignments for an associate
 */
export async function getAssociateAssignments(associateId: string) {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        project:projects!assignments_project_id_fkey(*)
      `)
      .eq('associate_id', associateId)
      .order('assigned_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    console.error('Error fetching associate assignments:', error)
    return { data: null, error: error.message }
  }
}
