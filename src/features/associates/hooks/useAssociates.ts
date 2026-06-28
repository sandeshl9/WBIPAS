/**
 * React Query hook for fetching associates with workload
 */

import { useQuery } from '@tanstack/react-query'
import { AssociateService } from '../services/AssociateService'

export const useAssociates = () => {
  return useQuery({
    queryKey: ['associates'],
    queryFn: async () => {
      const result = await AssociateService.getAssociatesWithWorkload()
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data || []
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
