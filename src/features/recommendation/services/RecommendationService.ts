/**
 * APPLICATION LAYER - RecommendationService
 * 
 * Orchestrates the recommendation process by:
 * 1. Fetching data from repositories
 * 2. Calling the recommendation engine
 * 3. Handling errors
 * 4. Returning structured results
 * 
 * Version: 2.0.0 (Volume 4 Compliant)
 * 
 * This service has NO business logic calculations.
 * All calculations are delegated to the recommendation engine.
 */

import { 
  AssignmentEngine, 
  type RecommendationContext,
  type RecommendationResult,
  type RankedRecommendation,
  type SimulationResult,
} from '@/recommendation-engine'
import { AssociateRepository } from '@/repositories/AssociateRepository'
import { WorkloadRepository } from '@/repositories/WorkloadRepository'
import { ProjectRepository } from '@/repositories/ProjectRepository'
import { getWeekNumber, getYear } from '@/lib/utils'

export class RecommendationService {
  /**
   * Get recommendation for a project
   */
  static async getRecommendation(projectDate: Date): Promise<{
    data: RecommendationResult | null
    error: string | null
  }> {
    try {
      const context = await this.buildRecommendationContext(projectDate)
      
      if (!context) {
        return {
          data: null,
          error: 'Failed to build recommendation context',
        }
      }

      // Call recommendation engine (pure domain logic)
      const recommendation = AssignmentEngine.getRecommendation(context)

      if (!recommendation) {
        return {
          data: null,
          error: 'No eligible associates found with available capacity',
        }
      }

      return {
        data: recommendation,
        error: null,
      }
    } catch (error: any) {
      console.error('Error generating recommendation:', error)
      return {
        data: null,
        error: error.message || 'Failed to generate recommendation',
      }
    }
  }

  /**
   * Get recommendation for a specific project by ID
   */
  static async getRecommendationForProject(projectId: string): Promise<{
    data: RecommendationResult | null
    error: string | null
  }> {
    try {
      // Fetch project
      const { data: project, error: projectError } = await ProjectRepository.findById(projectId)
      
      if (projectError || !project) {
        return {
          data: null,
          error: 'Project not found',
        }
      }

      // Get recommendation using project date
      return await this.getRecommendation(new Date(project.project_date))
    } catch (error: any) {
      console.error('Error generating recommendation for project:', error)
      return {
        data: null,
        error: error.message || 'Failed to generate recommendation',
      }
    }
  }

  /**
   * Get top N ranked recommendations (enterprise feature)
   */
  static async getTopCandidates(
    projectDate: Date,
    limit: number = 5
  ): Promise<{
    data: RankedRecommendation[] | null
    error: string | null
  }> {
    try {
      const context = await this.buildRecommendationContext(projectDate)
      
      if (!context) {
        return {
          data: null,
          error: 'Failed to build recommendation context',
        }
      }

      // Get top N candidates
      const ranked = AssignmentEngine.getTopCandidates(context, limit)

      return {
        data: ranked,
        error: null,
      }
    } catch (error: any) {
      console.error('Error getting top candidates:', error)
      return {
        data: null,
        error: error.message || 'Failed to get recommendations',
      }
    }
  }

  /**
   * Simulate bulk assignment (enterprise feature)
   */
  static async simulateDistribution(
    projects: Array<{ date: Date }>
  ): Promise<{
    data: SimulationResult | null
    error: string | null
  }> {
    try {
      // Fetch data once (use current state)
      const { data: associates } = await AssociateRepository.findActiveAndAvailable()
      const { data: rawWorkload } = await WorkloadRepository.getCurrentWorkload()

      if (!associates || !rawWorkload) {
        return {
          data: null,
          error: 'Failed to fetch data for simulation',
        }
      }

      // Build workload data
      const workloadData = associates.map((associate) => {
        const workload = rawWorkload.find((w) => w.associateId === associate.id)
        return {
          associateId: associate.id,
          activeProjectCount: (workload?.activeProjectCount || 0) + (workload?.openingBalanceCount || 0),
          weeklyAssignedCount: workload?.activeProjectCount || 0,
          oldestProjectDate: workload?.oldestProjectDate ? new Date(workload.oldestProjectDate) : null,
        }
      })

      // Build base context (will be updated for each project)
      const context: RecommendationContext = {
        projectDate: new Date(),
        weekNumber: 0,
        year: 0,
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

      // Call simulation (domain logic)
      const simulation = AssignmentEngine.simulateDistribution(projects, context)

      return {
        data: simulation,
        error: null,
      }
    } catch (error: any) {
      console.error('Error simulating distribution:', error)
      return {
        data: null,
        error: error.message || 'Simulation failed',
      }
    }
  }

  /**
   * Build recommendation context from current data
   * (Private helper method)
   */
  private static async buildRecommendationContext(
    projectDate: Date
  ): Promise<RecommendationContext | null> {
    try {
      // Step 1: Fetch available associates
      const { data: associates, error: associatesError } =
        await AssociateRepository.findActiveAndAvailable()

      if (associatesError) throw new Error(associatesError)
      if (!associates || associates.length === 0) {
        return null
      }

      // Step 2: Fetch workload data
      const weekNumber = getWeekNumber(projectDate)
      const year = getYear(projectDate)

      const { data: rawWorkload, error: workloadError } =
        await WorkloadRepository.getWorkloadForWeek(weekNumber, year)

      if (workloadError) throw new Error(workloadError)

      // Step 3: Transform data for recommendation engine
      const workloadData = associates.map((associate) => {
        const workload = rawWorkload?.find((w) => w.associateId === associate.id)
        return {
          associateId: associate.id,
          activeProjectCount: (workload?.activeProjectCount || 0) + (workload?.openingBalanceCount || 0),
          weeklyAssignedCount: workload?.activeProjectCount || 0,
          oldestProjectDate: workload?.oldestProjectDate ? new Date(workload.oldestProjectDate) : null,
        }
      })

      // Step 4: Build and return context
      return {
        projectDate,
        weekNumber,
        year,
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
    } catch (error: any) {
      console.error('Error building recommendation context:', error)
      return null
    }
  }

  /**
   * Validate recommendation context
   */
  static async validateContext(projectDate: Date): Promise<{
    valid: boolean
    errors: string[]
  }> {
    const context = await this.buildRecommendationContext(projectDate)
    
    if (!context) {
      return {
        valid: false,
        errors: ['Failed to build context - no associates available'],
      }
    }

    return AssignmentEngine.validateContext(context)
  }

  /**
   * Get engine information
   */
  static getEngineInfo() {
    return AssignmentEngine.getEngineInfo()
  }
}

