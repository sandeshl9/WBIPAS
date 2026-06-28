/**
 * RECENT ASSIGNMENTS - Dashboard Component
 * 
 * Timeline of recent project assignments
 */

import React from 'react'
import { motion } from 'framer-motion'
import { Clock, User, Folder } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/Badge'
import { formatDistanceToNow } from 'date-fns'

export interface Assignment {
  id: string
  projectName: string
  associateName: string
  assignedAt: Date
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'
}

export interface RecentAssignmentsProps {
  assignments: Assignment[]
  loading?: boolean
}

export function RecentAssignments({ assignments, loading = false }: RecentAssignmentsProps) {
  if (loading) {
    return (
      <div className="card p-6">
        <h3 className="text-card-title font-semibold mb-4">Recent Assignments</h3>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="skeleton h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (assignments.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-card-title font-semibold mb-4">Recent Assignments</h3>
        <EmptyState
          icon={Clock}
          title="No recent assignments"
          description="Assignments will appear here once you start creating projects."
        />
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-card-title font-semibold">Recent Assignments</h3>
        <span className="text-xs text-muted-foreground">
          Last 24 hours
        </span>
      </div>

      <div className="space-y-4">
        {assignments.map((assignment, index) => (
          <motion.div
            key={assignment.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-start gap-4 pb-4 border-b border-border last:border-0 last:pb-0"
          >
            {/* Timeline Dot */}
            <div className="flex flex-col items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/20">
                <Folder className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              {index < assignments.length - 1 && (
                <div className="w-px h-full bg-border mt-2" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-medium text-sm text-foreground truncate">
                  {assignment.projectName}
                </p>
                <StatusBadge status={assignment.status} />
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                <span>{assignment.associateName}</span>
                <span>•</span>
                <span>{formatDistanceToNow(assignment.assignedAt, { addSuffix: true })}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
