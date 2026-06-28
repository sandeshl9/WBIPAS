/**
 * React Query hook for fetching projects by associate
 */

import { useQuery } from '@tanstack/react-query'
import { ProjectService } from '../services/ProjectService'

export const useProjectsByAssociate = (associateId: string | null | undefined) => {
  return useQuery({
    queryKey: ['projects', 'by-associate', associateId],
    queryFn: async () => {
      if (!associateId) return []
      
      const result = await ProjectService.getProjectsByAssociate(associateId)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data || []
    },
    enabled: !!associateId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
