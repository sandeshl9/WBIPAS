/**
 * APPLICATION LAYER - DashboardService
 * 
 * Orchestrates dashboard data aggregation.
 * Coordinates data from multiple repositories.
 */

import { AssociateRepository } from '@/repositories/AssociateRepository'
import { ProjectRepository } from '@/repositories/ProjectRepository'
import { WorkloadRepository } from '@/repositories/WorkloadRepository'
import { UtilizationCalculator } from '@/domain/UtilizationCalculator'

export interface DashboardStats {
  totalAssociates: number
  activeAssociates: number
  availableAssociates: number
  totalProjects: number
  activeProjects: number
  completedProjects: number
  pendingProjects: number
  averageUtilization: number
  totalCapacity: number
  usedCapacity: number
}

export interface RecentActivity {
  id: string
  type: 'assignment' | 'completion' | 'creation'
  description: string
  timestamp: string
  associateName?: string
  projectName?: string
}

export interface AssociateUtilization {
  associateId: string
  associateName: string
  currentWorkload: number
  weeklyCapacity: number
  utilization: number
  isAvailable: boolean
}

export class DashboardService {
  /**
   * Get dashboard statistics
   */
  static async getStatistics(): Promise<{ data: DashboardStats | null; error: string | null }> {
    try {
      // Fetch all data in parallel
      const [
        { data: allAssociates },
        { data: activeAssociates },
        { data: allProjects },
        { data: activeProjects },
        { data: completedProjects },
        { data: pendingProjects },
        { data: workloadData },
      ] = await Promise.all([
        AssociateRepository.findAll(),
        AssociateRepository.findActiveAndAvailable(),
        ProjectRepository.findAll(),
        ProjectRepository.findActive(),
        ProjectRepository.findByStatus('completed'),
        ProjectRepository.findByStatus('pending'),
        WorkloadRepository.getCurrentWorkload(),
      ])

      // Calculate total capacity
      const totalCapacity = allAssociates?.reduce(
        (sum, associate) => sum + associate.weekly_capacity,
        0
      ) || 0

      // Calculate used capacity
      const usedCapacity = workloadData?.reduce(
        (sum, workload) => 
          sum + (workload.activeProjectCount || 0) + (workload.openingBalanceCount || 0),
        0
      ) || 0

      // Calculate average utilization using domain logic
      const averageUtilization = UtilizationCalculator.calculateAverageUtilization(
        allAssociates || [],
        workloadData || []
      )

      const stats: DashboardStats = {
        totalAssociates: allAssociates?.length || 0,
        activeAssociates: allAssociates?.filter((a) => a.is_active)?.length || 0,
        availableAssociates: activeAssociates?.length || 0,
        totalProjects: allProjects?.length || 0,
        activeProjects: activeProjects?.length || 0,
        completedProjects: completedProjects?.length || 0,
        pendingProjects: pendingProjects?.length || 0,
        averageUtilization,
        totalCapacity,
        usedCapacity,
      }

      return { data: stats, error: null }
    } catch (error: any) {
      console.error('Error fetching dashboard statistics:', error)
      return { data: null, error: error.message }
    }
  }

  /**
   * Get associate utilization data
   */
  static async getAssociateUtilization(): Promise<{
    data: AssociateUtilization[] | null
    error: string | null
  }> {
    try {
      const { data: associates } = await AssociateRepository.findAll()
      const { data: workloadData } = await WorkloadRepository.getCurrentWorkload()

      if (!associates) {
        return { data: [], error: null }
      }

      const utilization: AssociateUtilization[] = associates.map((associate) => {
        const workload = workloadData?.find((w) => w.associateId === associate.id)
        const currentWorkload =
          (workload?.activeProjectCount || 0) + (workload?.openingBalanceCount || 0)

        // Use domain calculator
        const utilization = UtilizationCalculator.calculateUtilization(
          currentWorkload,
          associate.weekly_capacity
        )

        return {
          associateId: associate.id,
          associateName: associate.name,
          currentWorkload,
          weeklyCapacity: associate.weekly_capacity,
          utilization,
          isAvailable: associate.is_available,
        }
      })

      // Sort by utilization descending
      utilization.sort((a, b) => b.utilization - a.utilization)

      return { data: utilization, error: null }
    } catch (error: any) {
      console.error('Error fetching associate utilization:', error)
      return { data: null, error: error.message }
    }
  }

  /**
   * Get recent activity
   */
  static async getRecentActivity(limit = 10): Promise<{
    data: RecentActivity[] | null
    error: string | null
  }> {
    try {
      // Get recent projects (last created/updated)
      const { data: recentProjects } = await ProjectRepository.findAll()

      if (!recentProjects || recentProjects.length === 0) {
        return { data: [], error: null }
      }

      // Sort by created_at descending
      const sortedProjects = recentProjects
        .sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, limit)

      const activities: RecentActivity[] = sortedProjects.map((project) => {
        let type: 'assignment' | 'completion' | 'creation' = 'creation'
        let description = `Project "${project.project_name}" created`

        if (project.status === 'completed' && project.completion_date) {
          type = 'completion'
          description = `Project "${project.project_name}" completed`
        } else if (project.assigned_to && project.status === 'assigned') {
          type = 'assignment'
          description = `Project "${project.project_name}" assigned`
        }

        return {
          id: project.id,
          type,
          description,
          timestamp: project.completion_date || project.created_at,
          projectName: project.project_name,
        }
      })

      return { data: activities, error: null }
    } catch (error: any) {
      console.error('Error fetching recent activity:', error)
      return { data: null, error: error.message }
    }
  }

  /**
   * Get capacity heatmap data (weekly view)
   */
  static async getCapacityHeatmap() {
    try {
      const { data: associates } = await AssociateRepository.findAll()
      const { data: workloadData } = await WorkloadRepository.getCurrentWorkload()

      if (!associates) {
        return { data: [], error: null }
      }

      const heatmapData = associates.map((associate) => {
        const workload = workloadData?.find((w) => w.associateId === associate.id)
        const currentWorkload =
          (workload?.activeProjectCount || 0) + (workload?.openingBalanceCount || 0)

        const utilization = UtilizationCalculator.calculateUtilization(
          currentWorkload,
          associate.weekly_capacity
        )

        return {
          associateId: associate.id,
          associateName: associate.name,
          utilization,
          currentWorkload,
          capacity: associate.weekly_capacity,
          status: utilization >= 100 ? 'full' : utilization >= 75 ? 'busy' : 'available',
        }
      })

      return { data: heatmapData, error: null }
    } catch (error: any) {
      console.error('Error fetching capacity heatmap:', error)
      return { data: null, error: error.message }
    }
  }
}
