/**
 * React Query hook for simulating bulk project assignments
 */

import { useQuery } from '@tanstack/react-query'
import { RecommendationService } from '../services/RecommendationService'

interface Project {
  date: Date
  name?: string
}

interface UseBulkAssignmentSimulationOptions {
  projects: Project[]
  enabled?: boolean
}

export const useBulkAssignmentSimulation = ({ 
  projects, 
  enabled = true 
}: UseBulkAssignmentSimulationOptions) => {
  return useQuery({
    queryKey: ['bulk-assignment-simulation', projects.length],
    queryFn: async () => {
      if (!projects || projects.length === 0) {
        throw new Error('No projects provided for simulation')
      }
      
      const result = await RecommendationService.simulateBulkAssignment(projects)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data || []
    },
    enabled: enabled && projects.length > 0,
    staleTime: 0, // Simulations should always be fresh
  })
}
