/**
 * React Query mutation hook for updating project status
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ProjectService } from '../services/ProjectService'
import { toast } from '@/lib/toast'

interface UpdateProjectStatusParams {
  id: string
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'
}

export const useUpdateProjectStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: UpdateProjectStatusParams) => {
      const result = await ProjectService.updateProjectStatus(id, status)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data!
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['project-statistics'] })
      queryClient.invalidateQueries({ queryKey: ['associates'] })
      
      const statusMessage = variables.status === 'completed' 
        ? 'completed' 
        : `status updated to ${variables.status.replace('_', ' ')}`
      
      toast.success(`Project "${data.project_name}" ${statusMessage}`)
    },
    onError: (error: Error) => {
      toast.error(`Failed to update project status: ${error.message}`)
    },
  })
}
