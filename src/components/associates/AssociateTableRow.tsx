/**
 * ASSOCIATE TABLE ROW - Volume 6 Component
 * 
 * Single row in the associate table with all data
 */

import React from 'react'
import { Eye, Edit, Ban, History } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { CapacityBadge, AvailabilityBadge } from '@/components/ui/Badge'
import { ActionMenu } from '@/components/ui/ActionMenu'
import type { Associate } from '@/types/associate'

export interface AssociateTableRowProps {
  associate: Associate
  onView: (id: string) => void
  onEdit: (id: string) => void
  onDisable: (id: string) => void
  onHistory: (id: string) => void
}

export function AssociateTableRow({
  associate,
  onView,
  onEdit,
  onDisable,
  onHistory,
}: AssociateTableRowProps) {
  const remainingCapacity = associate.weeklyCapacity - associate.currentWorkload

  const actionItems = [
    {
      icon: Eye,
      label: 'View Details',
      onClick: () => onView(associate.id),
    },
    {
      icon: Edit,
      label: 'Edit Associate',
      onClick: () => onEdit(associate.id),
    },
    {
      icon: History,
      label: 'View History',
      onClick: () => onHistory(associate.id),
    },
    {
      icon: Ban,
      label: associate.isActive ? 'Disable' : 'Enable',
      onClick: () => onDisable(associate.id),
      variant: associate.isActive ? ('danger' as const) : ('default' as const),
    },
  ]

  return (
    <>
      {/* Avatar & Name */}
      <td>
        <div className="flex items-center gap-3">
          <Avatar name={associate.name} size="sm" />
          <div>
            <div className="font-medium text-foreground">{associate.name}</div>
            <div className="text-xs text-muted-foreground">{associate.employeeCode}</div>
          </div>
        </div>
      </td>

      {/* Email */}
      <td>
        <div className="text-sm text-muted-foreground">{associate.email}</div>
      </td>

      {/* Weekly Capacity */}
      <td>
        <div className="text-sm font-medium">{associate.weeklyCapacity}</div>
      </td>

      {/* Current Workload */}
      <td>
        <CapacityBadge
          current={associate.currentWorkload}
          total={associate.weeklyCapacity}
        />
      </td>

      {/* Remaining Capacity */}
      <td>
        <div
          className={`text-sm font-medium ${
            remainingCapacity > 0 ? 'text-success-600' : 'text-error-600'
          }`}
        >
          {remainingCapacity}
        </div>
      </td>

      {/* Availability */}
      <td>
        <AvailabilityBadge status={associate.availabilityStatus} />
      </td>

      {/* Status */}
      <td>
        {associate.isActive ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-success-600">
            <span className="h-2 w-2 rounded-full bg-success-600" />
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-muted-foreground" />
            Inactive
          </span>
        )}
      </td>

      {/* Actions */}
      <td>
        <ActionMenu items={actionItems} />
      </td>
    </>
  )
}
