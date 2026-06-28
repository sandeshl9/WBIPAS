/**
 * React Query hook for fetching dashboard statistics
 */

import { useQuery } from '@tanstack/react-query'
import { DashboardService } from '../services/DashboardService'

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const result = await DashboardService.getStatistics()
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data!
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // Auto-refresh every 5 minutes
  })
}
