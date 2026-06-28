/**
 * React Query mutation hook for toggling associate availability
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AssociateService } from '../services/AssociateService'
import { toast } from '@/lib/toast'

interface ToggleAvailabilityParams {
  id: string
  isAvailable: boolean
}

export const useToggleAvailability = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, isAvailable }: ToggleAvailabilityParams) => {
      const result = await AssociateService.toggleAvailability(id, isAvailable)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data!
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['associates'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      const status = variables.isAvailable ? 'available' : 'unavailable'
      toast.success(`Associate "${data.name}" marked as ${status}`)
    },
    onError: (error: Error) => {
      toast.error(`Failed to update availability: ${error.message}`)
    },
  })
}
