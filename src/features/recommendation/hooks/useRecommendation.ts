/**
 * React Query hook for fetching project assignment recommendation
 */

import { useQuery } from '@tanstack/react-query'
import { RecommendationService } from '../services/RecommendationService'

interface UseRecommendationOptions {
  projectDate: Date | null
  enabled?: boolean
}

export const useRecommendation = ({ projectDate, enabled = true }: UseRecommendationOptions) => {
  return useQuery({
    queryKey: ['recommendation', projectDate?.toISOString()],
    queryFn: async () => {
      if (!projectDate) {
        throw new Error('Project date is required')
      }
      
      const result = await RecommendationService.getRecommendation(projectDate)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
    enabled: enabled && !!projectDate,
    staleTime: 1000 * 30, // 30 seconds - recommendations should be fresh
    gcTime: 1000 * 60 * 5, // 5 minutes
  })
}
