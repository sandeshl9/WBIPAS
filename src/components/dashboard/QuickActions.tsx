/**
 * QUICK ACTIONS - Dashboard Component
 * 
 * Quick action buttons for common tasks
 */

import React from 'react'
import { Plus, UserPlus, Upload, FileBarChart } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { motion } from 'framer-motion'

export interface QuickActionsProps {
  onCreateProject: () => void
  onAddAssociate: () => void
  onImportOpeningBalance: () => void
  onViewReports: () => void
}

export function QuickActions({
  onCreateProject,
  onAddAssociate,
  onImportOpeningBalance,
  onViewReports,
}: QuickActionsProps) {
  const actions = [
    {
      label: 'Create Project',
      icon: Plus,
      onClick: onCreateProject,
      variant: 'primary' as const,
    },
    {
      label: 'Add Associate',
      icon: UserPlus,
      onClick: onAddAssociate,
      variant: 'secondary' as const,
    },
    {
      label: 'Import Opening Balance',
      icon: Upload,
      onClick: onImportOpeningBalance,
      variant: 'secondary' as const,
    },
    {
      label: 'View Reports',
      icon: FileBarChart,
      onClick: onViewReports,
      variant: 'secondary' as const,
    },
  ]

  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">
        Quick Actions
      </h3>
      <div className="flex flex-wrap gap-2">
        {actions.map((action, index) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Button
              variant={action.variant}
              size="sm"
              icon={action.icon}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
