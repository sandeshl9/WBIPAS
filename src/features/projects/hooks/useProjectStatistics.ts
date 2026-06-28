/**
 * React Query hook for fetching project statistics
 */

import { useQuery } from '@tanstack/react-query'
import { ProjectService } from '../services/ProjectService'

export const useProjectStatistics = () => {
  return useQuery({
    queryKey: ['project-statistics'],
    queryFn: async () => {
      const result = await ProjectService.getStatistics()
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data!
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
