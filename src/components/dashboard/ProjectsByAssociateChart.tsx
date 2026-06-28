/**
 * PROJECTS BY ASSOCIATE CHART - Dashboard Component
 * 
 * Bar chart showing projects per associate
 */

import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { getCapacityColor } from '@/styles/design-tokens'

export interface AssociateProjectData {
  name: string
  projects: number
  capacity: number
  utilization: number
}

export interface ProjectsByAssociateChartProps {
  data: AssociateProjectData[]
  loading?: boolean
}

export function ProjectsByAssociateChart({ data, loading = false }: ProjectsByAssociateChartProps) {
  if (loading) {
    return (
      <div className="card p-6">
        <h3 className="text-card-title font-semibold mb-4">Projects by Associate</h3>
        <div className="skeleton h-64 rounded" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-card-title font-semibold mb-4">Projects by Associate</h3>
        <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
          No data available
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <h3 className="text-card-title font-semibold mb-4">Projects by Associate</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            type="number"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            width={100}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value: number, name: string, props: any) => {
              const { payload } = props
              return [
                <div key="tooltip">
                  <div>Projects: {value}</div>
                  <div>Capacity: {payload.capacity}</div>
                  <div>Utilization: {payload.utilization}%</div>
                </div>,
              ]
            }}
          />
          <Bar dataKey="projects" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getCapacityColor(entry.utilization)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
