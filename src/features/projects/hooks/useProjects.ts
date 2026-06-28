/**
 * React Query hook for fetching projects
 */

import { useQuery } from '@tanstack/react-query'
import { ProjectService } from '../services/ProjectService'

interface UseProjectsOptions {
  status?: string[]
  weekNumber?: number
  year?: number
}

export const useProjects = (options?: UseProjectsOptions) => {
  return useQuery({
    queryKey: ['projects', options],
    queryFn: async () => {
      const result = await ProjectService.getProjects(options)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data || []
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
