/**
 * UPCOMING AVAILABILITY - Dashboard Component
 * 
 * Shows associates who will become available soon
 */

import React from 'react'
import { motion } from 'framer-motion'
import { Calendar, TrendingUp } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Avatar } from '@/components/ui/Avatar'
import { CapacityBadge } from '@/components/ui/Badge'

export interface AssociateAvailability {
  id: string
  name: string
  email: string
  currentWorkload: number
  capacity: number
  availableFrom: Date
  upcomingCapacity: number
}

export interface UpcomingAvailabilityProps {
  associates: AssociateAvailability[]
  loading?: boolean
}

export function UpcomingAvailability({ associates, loading = false }: UpcomingAvailabilityProps) {
  if (loading) {
    return (
      <div className="card p-6">
        <h3 className="text-card-title font-semibold mb-4">Upcoming Availability</h3>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="skeleton h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-2/3 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (associates.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-card-title font-semibold mb-4">Upcoming Availability</h3>
        <EmptyState
          icon={Calendar}
          title="All associates are available"
          description="There are no upcoming availability changes to display."
        />
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-card-title font-semibold">Upcoming Availability</h3>
        <TrendingUp className="h-4 w-4 text-success-600" />
      </div>

      <div className="space-y-3">
        {associates.map((associate, index) => (
          <motion.div
            key={associate.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
          >
            {/* Avatar */}
            <Avatar
              name={associate.name}
              size="md"
              src={undefined}
            />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {associate.name}
              </p>
              <p className="text-xs text-muted-foreground">
                Available from {associate.availableFrom.toLocaleDateString()}
              </p>
            </div>

            {/* Capacity */}
            <CapacityBadge
              current={associate.currentWorkload}
              total={associate.capacity}
            />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
