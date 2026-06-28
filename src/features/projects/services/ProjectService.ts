/**
 * APPLICATION LAYER - ProjectService
 * 
 * Orchestrates project operations.
 * NO business logic here - delegates to domain layer and repositories.
 */

import { ProjectRepository } from '@/repositories/ProjectRepository'
import { createAuditLog } from '@/services/auditService'
import { supabase } from '@/lib/supabase'
import { getWeekNumber, getYear } from '@/lib/utils'

export interface CreateProjectInput {
  projectId: string
  projectName: string
  client: string
  projectDate: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  comments?: string
}

export class ProjectService {
  /**
   * Get all projects
   */
  static async getProjects(filters?: {
    status?: string[]
    weekNumber?: number
    year?: number
  }) {
    try {
      if (filters?.weekNumber && filters?.year) {
        const { data, error } = await ProjectRepository.findByWeek(
          filters.weekNumber,
          filters.year
        )
        return { data, error }
      }

      if (filters?.status) {
        const { data, error } = await ProjectRepository.findByStatus(filters.status)
        return { data, error }
      }

      const { data, error } = await ProjectRepository.findAll()
      return { data, error }
    } catch (error: any) {
      console.error('Error fetching projects:', error)
      return { data: null, error: error.message }
    }
  }

  /**
   * Create project
   */
  static async createProject(input: CreateProjectInput) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Calculate week/year
      const projectDate = new Date(input.projectDate)
      const weekNumber = getWeekNumber(projectDate)
      const year = getYear(projectDate)

      const { data, error } = await ProjectRepository.create({
        project_id: input.projectId,
        project_name: input.projectName,
        client: input.client,
        project_date: input.projectDate,
        week_number: weekNumber,
        year: year,
        priority: input.priority,
        comments: input.comments,
        created_by: user.id,
        source: 'manual',
      })

      if (error) throw new Error(error)

      await createAuditLog({
        action: 'create_project',
        entityType: 'project',
        entityId: data!.id,
        newValue: data,
      })

      return { data, error: null }
    } catch (error: any) {
      console.error('Error creating project:', error)
      return { data: null, error: error.message }
    }
  }

  /**
   * Update project status
   */
  static async updateProjectStatus(
    id: string,
    status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'
  ) {
    try {
      const { data: oldData } = await ProjectRepository.findById(id)

      const updates: any = { status }
      if (status === 'completed') {
        updates.completion_date = new Date().toISOString()
      }

      const { data, error } = await ProjectRepository.update(id, updates)

      if (error) throw new Error(error)

      const action =
        status === 'completed'
          ? 'complete_project'
          : status === 'cancelled'
          ? 'cancel_project'
          : 'update_project'

      await createAuditLog({
        action,
        entityType: 'project',
        entityId: id,
        oldValue: oldData || undefined,
        newValue: data,
        metadata: { status_change: { from: oldData?.status, to: status } },
      })

      return { data, error: null }
    } catch (error: any) {
      console.error('Error updating project status:', error)
      return { data: null, error: error.message }
    }
  }

  /**
   * Get projects by associate
   */
  static async getProjectsByAssociate(associateId: string) {
    try {
      const { data, error } = await ProjectRepository.findByAssociate(associateId)
      return { data, error }
    } catch (error: any) {
      console.error('Error fetching projects by associate:', error)
      return { data: null, error: error.message }
    }
  }

  /**
   * Search projects
   */
  static async searchProjects(query: string) {
    try {
      const { data, error } = await ProjectRepository.search(query)
      return { data, error }
    } catch (error: any) {
      console.error('Error searching projects:', error)
      return { data: null, error: error.message }
    }
  }

  /**
   * Get project statistics
   */
  static async getStatistics() {
    try {
      const { data: allProjects } = await ProjectRepository.findAll()
      const { data: activeProjects } = await ProjectRepository.findActive()
      const { data: completedProjects } = await ProjectRepository.findByStatus('completed')

      return {
        data: {
          total: allProjects?.length || 0,
          active: activeProjects?.length || 0,
          completed: completedProjects?.length || 0,
        },
        error: null,
      }
    } catch (error: any) {
      console.error('Error fetching project statistics:', error)
      return { data: null, error: error.message }
    }
  }
}
