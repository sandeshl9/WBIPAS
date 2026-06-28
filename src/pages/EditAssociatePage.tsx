/**
 * EDIT ASSOCIATE PAGE - Volume 6 Screen 4 (Edit Mode)
 * 
 * Edit existing associate with validation
 */

import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { AssociateForm } from '@/components/associates/AssociateForm'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import type { AssociateFormValues } from '@/schemas/associateSchema'
import type { Associate } from '@/types/associate'

export default function EditAssociatePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  // TODO: Replace with actual API call
  const loading = false
  const mockAssociate: Associate = {
    id: id || '1',
    employeeCode: 'EMP001',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    weeklyCapacity: 5,
    currentWorkload: 5,
    availabilityStatus: 'available',
    department: 'Engineering',
    designation: 'Senior Developer',
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-06-20'),
  }

  const handleSubmit = async (data: AssociateFormValues) => {
    try {
      // TODO: Replace with actual API call
      console.log('Updating associate:', id, data)
      
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Show success message
      toast.success('Associate updated successfully!')

      // Navigate back to associates list
      navigate('/associates')
    } catch (error) {
      console.error('Error updating associate:', error)
      toast.error('Failed to update associate. Please try again.')
      throw error
    }
  }

  const handleCancel = () => {
    navigate('/associates')
  }

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSkeleton preset="form" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <AssociateForm
        mode="edit"
        initialData={mockAssociate}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  )
}
