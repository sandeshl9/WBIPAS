/**
 * React Query mutation hook for creating projects
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ProjectService, type CreateProjectInput } from '../services/ProjectService'
import { toast } from '@/lib/toast'

export const useCreateProject = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const result = await ProjectService.createProject(input)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data!
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['project-statistics'] })
      toast.success(`Project "${data.project_name}" created successfully`)
    },
    onError: (error: Error) => {
      toast.error(`Failed to create project: ${error.message}`)
    },
  })
}
