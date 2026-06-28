/**
 * React Query mutation hook for creating associates
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AssociateService, type CreateAssociateInput } from '../services/AssociateService'
import { toast } from '@/lib/toast'

export const useCreateAssociate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateAssociateInput) => {
      const result = await AssociateService.createAssociate(input)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data!
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['associates'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(`Associate "${data.name}" created successfully`)
    },
    onError: (error: Error) => {
      toast.error(`Failed to create associate: ${error.message}`)
    },
  })
}
