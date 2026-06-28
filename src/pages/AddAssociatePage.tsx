/**
 * ADD ASSOCIATE PAGE - Volume 6 Screen 4
 * 
 * Create new associate with validation
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { AssociateForm } from '@/components/associates/AssociateForm'
import type { AssociateFormValues } from '@/schemas/associateSchema'

export default function AddAssociatePage() {
  const navigate = useNavigate()

  const handleSubmit = async (data: AssociateFormValues) => {
    try {
      // TODO: Replace with actual API call
      console.log('Creating associate:', data)
      
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Show success message
      toast.success('Associate created successfully!')

      // Navigate back to associates list
      navigate('/associates')
    } catch (error) {
      console.error('Error creating associate:', error)
      toast.error('Failed to create associate. Please try again.')
      throw error
    }
  }

  const handleCancel = () => {
    navigate('/associates')
  }

  return (
    <div className="p-6">
      <AssociateForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  )
}
