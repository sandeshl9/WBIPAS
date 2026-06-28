/**
 * React Query hook for searching projects
 */

import { useQuery } from '@tanstack/react-query'
import { ProjectService } from '../services/ProjectService'

export const useSearchProjects = (query: string) => {
  return useQuery({
    queryKey: ['projects', 'search', query],
    queryFn: async () => {
      if (!query || query.trim().length === 0) {
        return []
      }
      
      const result = await ProjectService.searchProjects(query)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data || []
    },
    enabled: query.trim().length > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}
