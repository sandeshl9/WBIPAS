/**
 * ASSOCIATE TYPES
 * 
 * Type definitions for associates
 */

export type AvailabilityStatus = 'available' | 'leave' | 'training' | 'holiday' | 'inactive'

export interface Associate {
  id: string
  employeeCode: string
  name: string
  email: string
  weeklyCapacity: number
  currentWorkload: number
  availabilityStatus: AvailabilityStatus
  department?: string
  designation?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface AssociateFormData {
  employeeCode: string
  name: string
  email: string
  weeklyCapacity: number
  availabilityStatus: AvailabilityStatus
  department?: string
  designation?: string
}

export interface AssociateFilters {
  search: string
  availability: AvailabilityStatus[]
  capacity: 'low' | 'medium' | 'high' | 'full' | null
  status: 'active' | 'inactive' | null
}
