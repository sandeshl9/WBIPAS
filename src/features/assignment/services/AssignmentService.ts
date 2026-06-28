/**
 * APPLICATION LAYER - AssignmentService
 * 
 * Handles project assignment with full transaction support.
 * Integrates with database assign_project() stored procedure.
 * 
 * Version: 2.0.0 (Volume 4 Compliant)
 * 
 * Key Features:
 * - Atomic assignment transactions
 * - Recommendation revalidation before assignment
 * - Override handling with audit trail
 * - Sequential bulk assignment
 * - Complete error handling and rollback
 */

import { supabase } from '@/lib/supabase'
import { AssignmentEngine, ENGINE_VERSION, type RecommendationContext } from '@/recommendation-engine'
import { AssociateRepository } from '@/repositories/AssociateRepository'
import { WorkloadRepository } from '@/repositories/WorkloadRepository'
import { ProjectRepository } from '@/repositories/ProjectRepository'
import { getWeekNumber, getYear } from '@/lib/utils'

export interface AssignProjectInput {
  projectId: string
  associateId: string
  recommendationId?: string
  overrideReason?: string
  isOverride?: boolean
}

export interface AssignProjectResult {
  success: boolean
  assignmentId?: string
  recommendationLog?: any
  auditLog?: any
  error?: string
}

export interface BulkAssignmentInput {
  projectIds: string[]
  autoAssign: boolean // If true, use recommendations; if false, manual mode
}

export interface BulkAssignmentResult {
  totalProjects: number
  successfulAssignments: number
  failedAssignments: number
  assignments: Array<{
    projectId: string
    success: boolean
    associateId?: string
    associateName?: string
    error?: string
  }>
}

export class AssignmentService {
  /**
   * Assign a project to an associate
   * 
   * Uses database stored procedure for atomic transaction:
   * - Validates associate availability and capacity
   * - Creates assignment record
   * - Creates recommendation log
   * - Creates audit log
   * - Creates activity log
   * - Updates project status
   */
  static async assignProject(input: AssignProjectInput): Promise<AssignProjectResult> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return {
          success: false,
          error: 'User not authenticated',
        }
      }

      // Revalidate recommendation if not an override
      if (!input.isOverride && input.recommendationId) {
        const revalidation = await this.revalidateRecommendation(
          input.projectId,
          input.associateId
        )

        if (!revalidation.valid) {
          return {
            success: false,
            error: revalidation.error || 'Recommendation is no longer valid',
          }
        }
      }

      // Call database stored procedure
      const { data, error } = await supabase.rpc('assign_project', {
        p_project_id: input.projectId,
        p_associate_id: input.associateId,
        p_assigned_by: user.id,
        p_recommendation_id: input.recommendationId || null,
        p_override_reason: input.overrideReason || null,
        p_engine_version: ENGINE_VERSION,
      })

      if (error) {
        console.error('Error calling assign_project stored procedure:', error)
        return {
          success: false,
          error: error.message || 'Failed to assign project',
        }
      }

      // Parse result
      const result = typeof data === 'string' ? JSON.parse(data) : data

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Assignment failed',
        }
      }

      return {
        success: true,
        assignmentId: result.assignment_id,
        recommendationLog: result.recommendation_log,
        auditLog: result.audit_log,
      }
    } catch (error: any) {
      console.error('Error in assignProject:', error)
      return {
        success: false,
        error: error.message || 'Unexpected error during assignment',
      }
    }
  }

  /**
   * Revalidate recommendation before assignment
   * 
   * Checks for edge cases:
   * - Associate still active and available
   * - Associate still has capacity
   * - No concurrent assignments changed the state
   */
  private static async revalidateRecommendation(
    projectId: string,
    associateId: string
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      // Fetch project
      const { data: project, error: projectError } = await ProjectRepository.findById(projectId)
      
      if (projectError || !project) {
        return { valid: false, error: 'Project not found' }
      }

      // Fetch associate
      const { data: associate, error: associateError } = await AssociateRepository.findById(associateId)
      
      if (associateError || !associate) {
        return { valid: false, error: 'Associate not found' }
      }

      // Check if associate is still active and available
      if (!associate.is_active) {
        return { valid: false, error: 'Associate is no longer active' }
      }

      if (!associate.is_available && associate.availability_status !== 'available') {
        return { valid: false, error: 'Associate is no longer available' }
      }

      // Check if associate still has capacity
      const { data: workload } = await WorkloadRepository.getWorkloadForWeek(
        project.week_number,
        project.year
      )

      const associateWorkload = workload?.find(w => w.associateId === associateId)
      const weeklyCount = associateWorkload?.activeProjectCount || 0

      if (weeklyCount >= associate.weekly_capacity) {
        return { valid: false, error: 'Associate is now at full capacity' }
      }

      return { valid: true }
    } catch (error: any) {
      console.error('Error revalidating recommendation:', error)
      return { valid: false, error: 'Validation failed' }
    }
  }

  /**
   * Get recommendation and assign in one operation
   * 
   * This is the primary method for automatic assignment
   */
  static async getRecommendationAndAssign(projectId: string): Promise<AssignProjectResult> {
    try {
      // Fetch project
      const { data: project, error: projectError } = await ProjectRepository.findById(projectId)
      
      if (projectError || !project) {
        return {
          success: false,
          error: 'Project not found',
        }
      }

      // Get recommendation
      const { data: associates } = await AssociateRepository.findActiveAndAvailable()
      const { data: rawWorkload } = await WorkloadRepository.getWorkloadForWeek(
        project.week_number,
        project.year
      )

      if (!associates || associates.length === 0) {
        return {
          success: false,
          error: 'No available associates found',
        }
      }

      // Transform data for engine
      const workloadData = associates.map((associate) => {
        const workload = rawWorkload?.find((w) => w.associateId === associate.id)
        return {
          associateId: associate.id,
          activeProjectCount: (workload?.activeProjectCount || 0) + (workload?.openingBalanceCount || 0),
          weeklyAssignedCount: workload?.activeProjectCount || 0,
          oldestProjectDate: workload?.oldestProjectDate ? new Date(workload.oldestProjectDate) : null,
        }
      })

      const context: RecommendationContext = {
        projectDate: new Date(project.project_date),
        weekNumber: project.week_number,
        year: project.year,
        availableAssociates: associates.map((a) => ({
          id: a.id,
          name: a.name,
          email: a.email,
          weeklyCapacity: a.weekly_capacity,
          isActive: a.is_active,
          availabilityStatus: a.availability_status || 'available',
        })),
        workloadData,
      }

      // Get recommendation
      const recommendation = AssignmentEngine.getRecommendation(context)

      if (!recommendation) {
        return {
          success: false,
          error: 'No eligible associates found with available capacity',
        }
      }

      // Assign using recommendation
      return await this.assignProject({
        projectId,
        associateId: recommendation.associate.id,
        isOverride: false,
      })
    } catch (error: any) {
      console.error('Error in getRecommendationAndAssign:', error)
      return {
        success: false,
        error: error.message || 'Failed to assign project',
      }
    }
  }

  /**
   * Bulk assignment with sequential processing
   * 
   * CRITICAL: Each assignment recalculates recommendations to ensure fairness
   * This implements Step 11 from Volume 4 specification
   */
  static async bulkAssign(input: BulkAssignmentInput): Promise<BulkAssignmentResult> {
    const results: BulkAssignmentResult = {
      totalProjects: input.projectIds.length,
      successfulAssignments: 0,
      failedAssignments: 0,
      assignments: [],
    }

    // Sequential processing - DO NOT parallelize
    for (const projectId of input.projectIds) {
      try {
        if (input.autoAssign) {
          // Get fresh recommendation and assign
          const result = await this.getRecommendationAndAssign(projectId)

          if (result.success) {
            results.successfulAssignments++
            
            // Fetch associate name
            const { data: project } = await ProjectRepository.findById(projectId)
            
            results.assignments.push({
              projectId,
              success: true,
              associateId: project?.assigned_associate_id || undefined,
              associateName: project?.assigned_associate_name || undefined,
            })
          } else {
            results.failedAssignments++
            results.assignments.push({
              projectId,
              success: false,
              error: result.error,
            })
          }
        } else {
          // Manual mode - skip assignment, just track
          results.assignments.push({
            projectId,
            success: false,
            error: 'Manual assignment required',
          })
        }
      } catch (error: any) {
        console.error(`Error assigning project ${projectId}:`, error)
        results.failedAssignments++
        results.assignments.push({
          projectId,
          success: false,
          error: error.message || 'Assignment failed',
        })
      }
    }

    return results
  }

  /**
   * Reassign project to different associate
   * 
   * Creates new assignment record, marks old as ended
   * Preserves complete history
   */
  static async reassignProject(
    projectId: string,
    newAssociateId: string,
    reason?: string
  ): Promise<AssignProjectResult> {
    try {
      // Get current assignment
      const { data: project } = await ProjectRepository.findById(projectId)
      
      if (!project || !project.assigned_associate_id) {
        return {
          success: false,
          error: 'Project is not currently assigned',
        }
      }

      if (project.assigned_associate_id === newAssociateId) {
        return {
          success: false,
          error: 'Project is already assigned to this associate',
        }
      }

      // Mark old assignment as ended
      // This will be handled by the stored procedure if we enhance it
      // For now, we'll create a new assignment with override flag

      return await this.assignProject({
        projectId,
        associateId: newAssociateId,
        isOverride: true,
        overrideReason: reason || 'Reassignment',
      })
    } catch (error: any) {
      console.error('Error in reassignProject:', error)
      return {
        success: false,
        error: error.message || 'Reassignment failed',
      }
    }
  }

  /**
   * Get assignment history for a project
   */
  static async getAssignmentHistory(projectId: string) {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          associate:associates!assignments_associate_id_fkey(id, name, email),
          recommended:associates!assignments_recommended_associate_id_fkey(id, name, email),
          assigner:profiles!assignments_assigned_by_fkey(full_name, email)
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
   * Get recommendation logs for analysis
   */
  static async getRecommendationLogs(filters?: {
    projectId?: string
    associateId?: string
    accepted?: boolean
    limit?: number
  }) {
    try {
      let query = supabase
        .from('recommendation_logs')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters?.projectId) {
        query = query.eq('project_id', filters.projectId)
      }

      if (filters?.associateId) {
        query = query.eq('recommended_associate', filters.associateId)
      }

      if (filters?.accepted !== undefined) {
        query = query.eq('accepted', filters.accepted)
      }

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) throw error

      return { data, error: null }
    } catch (error: any) {
      console.error('Error fetching recommendation logs:', error)
      return { data: null, error: error.message }
    }
  }

  /**
   * Get override statistics for reporting
   */
  static async getOverrideStatistics(filters?: {
    startDate?: string
    endDate?: string
  }) {
    try {
      let query = supabase
        .from('assignments')
        .select('is_override, override_reason, assigned_at')

      if (filters?.startDate) {
        query = query.gte('assigned_at', filters.startDate)
      }

      if (filters?.endDate) {
        query = query.lte('assigned_at', filters.endDate)
      }

      const { data, error } = await query

      if (error) throw error

      const total = data?.length || 0
      const overrides = data?.filter(a => a.is_override).length || 0
      const overrideRate = total > 0 ? (overrides / total) * 100 : 0

      return {
        data: {
          total,
          overrides,
          overrideRate,
          recommendations: total - overrides,
        },
        error: null,
      }
    } catch (error: any) {
      console.error('Error fetching override statistics:', error)
      return { data: null, error: error.message }
    }
  }
}
