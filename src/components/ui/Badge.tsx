/**
 * BADGE - Volume 5 Component
 * 
 * Status badges with semantic colors
 */

import React from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getCapacityColor, getCapacityStatus } from '@/styles/design-tokens'

export interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral'
  size?: 'sm' | 'md'
  icon?: LucideIcon
  children: React.ReactNode
  className?: string
}

export function Badge({
  variant = 'neutral',
  size = 'md',
  icon: Icon,
  children,
  className,
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center gap-1 rounded-full font-medium'

  const variants = {
    success: 'bg-success-100 text-success-700 dark:bg-success-900/20 dark:text-success-400',
    warning: 'bg-warning-100 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400',
    error: 'bg-error-100 text-error-700 dark:bg-error-900/20 dark:text-error-400',
    info: 'bg-info-100 text-info-700 dark:bg-info-900/20 dark:text-info-400',
    neutral: 'bg-muted text-muted-foreground',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
  }

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)}>
      {Icon && <Icon className={iconSizes[size]} />}
      {children}
    </span>
  )
}

// Status-specific badges
export function StatusBadge({
  status,
  className,
}: {
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'
  className?: string
}) {
  const config = {
    pending: { variant: 'warning' as const, label: 'Pending' },
    assigned: { variant: 'info' as const, label: 'Assigned' },
    in_progress: { variant: 'info' as const, label: 'In Progress' },
    completed: { variant: 'success' as const, label: 'Completed' },
    cancelled: { variant: 'error' as const, label: 'Cancelled' },
    on_hold: { variant: 'neutral' as const, label: 'On Hold' },
  }

  const { variant, label } = config[status]

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  )
}

// Capacity badge with dynamic color
export function CapacityBadge({
  current,
  total,
  className,
}: {
  current: number
  total: number
  className?: string
}) {
  const percentage = total > 0 ? (current / total) * 100 : 0
  const color = getCapacityColor(percentage)
  const status = getCapacityStatus(percentage)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-medium',
        className
      )}
      style={{
        backgroundColor: `${color}20`,
        color: color,
      }}
    >
      {current}/{total} · {Math.round(percentage)}%
    </span>
  )
}

// Priority badge
export function PriorityBadge({
  priority,
  className,
}: {
  priority: 'low' | 'medium' | 'high' | 'urgent'
  className?: string
}) {
  const config = {
    low: { variant: 'neutral' as const, label: 'Low' },
    medium: { variant: 'info' as const, label: 'Medium' },
    high: { variant: 'warning' as const, label: 'High' },
    urgent: { variant: 'error' as const, label: 'Urgent' },
  }

  const { variant, label } = config[priority]

  return (
    <Badge variant={variant} size="sm" className={className}>
      {label}
    </Badge>
  )
}

// Availability badge
export function AvailabilityBadge({
  status,
  className,
}: {
  status: 'available' | 'leave' | 'training' | 'holiday' | 'inactive'
  className?: string
}) {
  const config = {
    available: { variant: 'success' as const, label: 'Available' },
    leave: { variant: 'warning' as const, label: 'On Leave' },
    training: { variant: 'info' as const, label: 'Training' },
    holiday: { variant: 'neutral' as const, label: 'Holiday' },
    inactive: { variant: 'error' as const, label: 'Inactive' },
  }

  const { variant, label } = config[status]

  return (
    <Badge variant={variant} size="sm" className={className}>
      {label}
    </Badge>
  )
}
