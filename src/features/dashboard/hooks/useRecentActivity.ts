/**
 * React Query hook for fetching recent activity
 */

import { useQuery } from '@tanstack/react-query'
import { DashboardService } from '../services/DashboardService'

export const useRecentActivity = (limit = 10) => {
  return useQuery({
    queryKey: ['dashboard', 'recent-activity', limit],
    queryFn: async () => {
      const result = await DashboardService.getRecentActivity(limit)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data || []
    },
    staleTime: 1000 * 60, // 1 minute
  })
}
