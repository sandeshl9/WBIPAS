/**
 * WEEKLY TREND CHART - Dashboard Component
 * 
 * Line chart showing weekly assignment trends
 */

import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

export interface WeeklyTrendData {
  week: string
  assigned: number
  completed: number
  capacity: number
}

export interface WeeklyTrendChartProps {
  data: WeeklyTrendData[]
  loading?: boolean
}

export function WeeklyTrendChart({ data, loading = false }: WeeklyTrendChartProps) {
  if (loading) {
    return (
      <div className="card p-6">
        <h3 className="text-card-title font-semibold mb-4">Weekly Trend</h3>
        <div className="skeleton h-64 rounded" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-card-title font-semibold mb-4">Weekly Trend</h3>
        <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
          No data available
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <h3 className="text-card-title font-semibold mb-4">Weekly Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="week"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
          />
          <Line
            type="monotone"
            dataKey="assigned"
            stroke="#2563EB"
            strokeWidth={2}
            dot={{ fill: '#2563EB', r: 4 }}
            name="Assigned"
          />
          <Line
            type="monotone"
            dataKey="completed"
            stroke="#22C55E"
            strokeWidth={2}
            dot={{ fill: '#22C55E', r: 4 }}
            name="Completed"
          />
          <Line
            type="monotone"
            dataKey="capacity"
            stroke="#E5E7EB"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Capacity"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
