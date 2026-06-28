/**
 * React Query mutation hook for deleting associates
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AssociateService } from '../services/AssociateService'
import { toast } from '@/lib/toast'

export const useDeleteAssociate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await AssociateService.deleteAssociate(id)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data!
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['associates'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(`Associate "${data.name}" deleted successfully`)
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete associate: ${error.message}`)
    },
  })
}
