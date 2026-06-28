/**
 * React Query hook for fetching associate utilization data
 */

import { useQuery } from '@tanstack/react-query'
import { DashboardService } from '../services/DashboardService'

export const useAssociateUtilization = () => {
  return useQuery({
    queryKey: ['dashboard', 'utilization'],
    queryFn: async () => {
      const result = await DashboardService.getAssociateUtilization()
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data || []
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}
