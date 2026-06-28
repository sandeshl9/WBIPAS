/**
 * APPLICATION LAYER - AssociateService
 * 
 * Orchestrates associate operations:
 * - Validation
 * - Calling repositories
 * - Audit logging
 * - Error handling
 * 
 * NO business calculations here.
 * Domain logic is in CapacityCalculator and WorkloadCalculator.
 */

import { AssociateRepository } from '@/repositories/AssociateRepository'
import { WorkloadRepository } from '@/repositories/WorkloadRepository'
import { WorkloadCalculator } from '@/domain/WorkloadCalculator'
import { CapacityCalculator } from '@/domain/CapacityCalculator'
import { createAuditLog } from '@/services/auditService'
import { supabase } from '@/lib/supabase'

export interface CreateAssociateInput {
  employeeId: string
  name: string
  email: string
  weeklyCapacity: number
  department?: string
  skills?: string[]
}

export interface UpdateAssociateInput {
  name?: string
  email?: string
  weeklyCapacity?: number
  department?: string
  skills?: string[]
  isAvailable?: boolean
  isActive?: boolean
}

export class AssociateService {
  /**
   * Get all associates with workload
   */
  static async getAssociatesWithWorkload() {
    try {
      // Fetch associates
      const { data: associates, error: associatesError } =
        await AssociateRepository.findAll()

      if (associatesError) throw new Error(associatesError)
      if (!associates) return { data: [], error: null }

      // Fetch workload data
      const { data: workloadData, error: workloadError } =
        await WorkloadRepository.getCurrentWorkload()

      if (workloadError) throw new Error(workloadError)

      // Combine and calculate (using domain logic)
      const result = associates.map((associate) => {
        const workload = workloadData?.find((w) => w.associateId === associate.id)
        const currentWorkload =
          (workload?.activeProjectCount || 0) + (workload?.openingBalanceCount || 0)

        // Use domain calculators
        const availableCapacity = WorkloadCalculator.calculateAvailableCapacity(
          associate.weekly_capacity,
          currentWorkload
        )

        const utilization = CapacityCalculator.calculateUtilization(
          currentWorkload,
          associate.weekly_capacity
        )

        return {
          ...associate,
          current_workload: currentWorkload,
          available_capacity: availableCapacity,
          utilization_percentage: utilization,
        }
      })

      return { data: result, error: null }
    } catch (error: any) {
      console.error('Error fetching associates with workload:', error)
      return { data: null, error: error.message }
    }
  }

  /**
   * Create associate
   */
  static async createAssociate(input: CreateAssociateInput) {
    try {
      // Validate using domain logic
      if (!CapacityCalculator.isValidCapacity(input.weeklyCapacity)) {
        throw new Error('Weekly capacity must be between 1 and 100')
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Call repository
      const { data, error } = await AssociateRepository.create({
        employee_id: input.employeeId,
        name: input.name,
        email: input.email,
        weekly_capacity: input.weeklyCapacity,
        department: input.department,
        skills: input.skills,
        created_by: user.id,
      })

      if (error) throw new Error(error)

      // Audit log
      await createAuditLog({
        action: 'create_associate',
        entityType: 'associate',
        entityId: data!.id,
        newValue: data,
      })

      return { data, error: null }
    } catch (error: any) {
      console.error('Error creating associate:', error)
      return { data: null, error: error.message }
    }
  }

  /**
   * Update associate
   */
  static async updateAssociate(id: string, input: UpdateAssociateInput) {
    try {
      // Validate capacity if provided
      if (input.weeklyCapacity !== undefined) {
        if (!CapacityCalculator.isValidCapacity(input.weeklyCapacity)) {
          throw new Error('Weekly capacity must be between 1 and 100')
        }
      }

      // Get old value for audit
      const { data: oldData } = await AssociateRepository.findById(id)

      // Update via repository
      const { data, error } = await AssociateRepository.update(id, input)

      if (error) throw new Error(error)

      // Audit log
      await createAuditLog({
        action: 'update_associate',
        entityType: 'associate',
        entityId: id,
        oldValue: oldData || undefined,
        newValue: data,
      })

      return { data, error: null }
    } catch (error: any) {
      console.error('Error updating associate:', error)
      return { data: null, error: error.message }
    }
  }

  /**
   * Delete associate (soft delete)
   */
  static async deleteAssociate(id: string) {
    try {
      const { data: oldData } = await AssociateRepository.findById(id)

      const { data, error } = await AssociateRepository.softDelete(id)

      if (error) throw new Error(error)

      await createAuditLog({
        action: 'delete_associate',
        entityType: 'associate',
        entityId: id,
        oldValue: oldData || undefined,
        newValue: data,
      })

      return { data, error: null }
    } catch (error: any) {
      console.error('Error deleting associate:', error)
      return { data: null, error: error.message }
    }
  }

  /**
   * Toggle availability
   */
  static async toggleAvailability(id: string, isAvailable: boolean) {
    return this.updateAssociate(id, { isAvailable })
  }

  /**
   * Search associates
   */
  static async searchAssociates(query: string) {
    try {
      const { data, error } = await AssociateRepository.search(query)

      if (error) throw new Error(error)

      return { data, error: null }
    } catch (error: any) {
      console.error('Error searching associates:', error)
      return { data: null, error: error.message }
    }
  }
}
