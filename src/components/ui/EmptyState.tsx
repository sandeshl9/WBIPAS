/**
 * EMPTY STATE - Volume 5 Component
 * 
 * Professional empty state with illustration, message, and action
 * Never show blank pages
 */

import React from 'react'
import { LucideIcon } from 'lucide-react'
import { Button } from './Button'

export interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
  illustration?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  illustration,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      {/* Icon or Illustration */}
      {illustration ? (
        <div className="mb-6">{illustration}</div>
      ) : (
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Icon className="h-10 w-10 text-muted-foreground" />
        </div>
      )}

      {/* Title */}
      <h3 className="text-lg font-semibold text-foreground">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
          {description}
        </p>
      )}

      {/* Action Button */}
      {action && (
        <Button
          onClick={action.onClick}
          className="mt-6"
          icon={action.icon}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}

// Preset Empty States
export function NoDataEmptyState({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={require('lucide-react').Database}
      title="No data available"
      description="There is no data to display at the moment. Try adjusting your filters or creating new entries."
      action={
        onAction
          ? {
              label: 'Create New',
              onClick: onAction,
            }
          : undefined
      }
    />
  )
}

export function NoResultsEmptyState() {
  return (
    <EmptyState
      icon={require('lucide-react').Search}
      title="No results found"
      description="We couldn't find anything matching your search. Try different keywords or filters."
    />
  )
}

export function NoProjectsEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={require('lucide-react').FolderOpen}
      title="No projects yet"
      description="Get started by creating your first project. Projects are automatically assigned to available associates."
      action={{
        label: 'Create Project',
        onClick: onCreate,
        icon: require('lucide-react').Plus,
      }}
    />
  )
}

export function NoAssociatesEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={require('lucide-react').Users}
      title="No associates yet"
      description="Add associates to your team to start assigning projects. You can import them from a CSV or add them manually."
      action={{
        label: 'Add Associate',
        onClick: onCreate,
        icon: require('lucide-react').UserPlus,
      }}
    />
  )
}
