/**
 * React Query hook for searching associates
 */

import { useQuery } from '@tanstack/react-query'
import { AssociateService } from '../services/AssociateService'

export const useSearchAssociates = (query: string) => {
  return useQuery({
    queryKey: ['associates', 'search', query],
    queryFn: async () => {
      if (!query || query.trim().length === 0) {
        return []
      }
      
      const result = await AssociateService.searchAssociates(query)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data || []
    },
    enabled: query.trim().length > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}
