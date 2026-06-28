/**
 * React Query hook for fetching capacity heatmap data
 */

import { useQuery } from '@tanstack/react-query'
import { DashboardService } from '../services/DashboardService'

export const useCapacityHeatmap = () => {
  return useQuery({
    queryKey: ['dashboard', 'heatmap'],
    queryFn: async () => {
      const result = await DashboardService.getCapacityHeatmap()
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data || []
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}
