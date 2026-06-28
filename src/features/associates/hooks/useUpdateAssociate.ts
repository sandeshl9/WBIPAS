/**
 * React Query mutation hook for updating associates
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AssociateService, type UpdateAssociateInput } from '../services/AssociateService'
import { toast } from '@/lib/toast'

interface UpdateAssociateParams {
  id: string
  input: UpdateAssociateInput
}

export const useUpdateAssociate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, input }: UpdateAssociateParams) => {
      const result = await AssociateService.updateAssociate(id, input)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data!
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['associates'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(`Associate "${data.name}" updated successfully`)
    },
    onError: (error: Error) => {
      toast.error(`Failed to update associate: ${error.message}`)
    },
  })
}
