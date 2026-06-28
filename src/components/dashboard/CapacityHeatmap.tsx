/**
 * CAPACITY HEATMAP - Dashboard Component
 * 
 * Visual heatmap showing busy weeks
 */

import React from 'react'
import { motion } from 'framer-motion'
import { getCapacityColor } from '@/styles/design-tokens'
import { Tooltip } from '@/components/ui/Tooltip'

export interface WeekData {
  week: number
  year: number
  utilization: number // 0-100%
  projectCount: number
}

export interface CapacityHeatmapProps {
  data: WeekData[]
  loading?: boolean
}

export function CapacityHeatmap({ data, loading = false }: CapacityHeatmapProps) {
  if (loading) {
    return (
      <div className="card p-6">
        <h3 className="text-card-title font-semibold mb-4">Capacity Heatmap</h3>
        <div className="grid grid-cols-12 gap-2">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="skeleton h-16 rounded" />
          ))}
        </div>
      </div>
    )
  }

  // Take last 12 weeks
  const weeks = data.slice(-12)

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-card-title font-semibold">Capacity Heatmap</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Low</span>
          <div className="flex gap-1">
            {[20, 50, 80, 100].map(val => (
              <div
                key={val}
                className="h-4 w-4 rounded"
                style={{ backgroundColor: getCapacityColor(val) }}
              />
            ))}
          </div>
          <span>High</span>
        </div>
      </div>

      <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
        {weeks.map((week, index) => (
          <motion.div
            key={`${week.year}-W${week.week}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03 }}
            className="group relative"
          >
            <div
              className="aspect-square rounded-lg transition-all hover:scale-110 hover:shadow-md cursor-pointer"
              style={{ backgroundColor: getCapacityColor(week.utilization) }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                <div>{week.utilization}%</div>
              </div>
            </div>
            
            {/* Tooltip */}
            <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-10">
              <div className="font-semibold">Week {week.week}, {week.year}</div>
              <div className="text-gray-300">{week.utilization}% utilized</div>
              <div className="text-gray-300">{week.projectCount} projects</div>
              {/* Arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
            </div>
          </motion.div>
        ))}
      </div>

      {weeks.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No data available for heatmap
        </div>
      )}
    </div>
  )
}
