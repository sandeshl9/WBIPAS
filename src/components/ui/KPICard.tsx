/**
 * KPI CARD - Volume 5 Component
 * 
 * Enterprise-grade KPI card with icon, value, title, trend, and mini chart
 * Inspired by Linear, Stripe Dashboard
 */

import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export interface KPICardProps {
  icon: LucideIcon
  title: string
  value: string | number
  trend?: {
    value: number
    label: string
    direction: 'up' | 'down' | 'neutral'
  }
  chart?: React.ReactNode
  loading?: boolean
  className?: string
}

export function KPICard({
  icon: Icon,
  title,
  value,
  trend,
  chart,
  loading = false,
  className = '',
}: KPICardProps) {
  if (loading) {
    return (
      <div className={`card p-6 ${className}`}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="skeleton h-10 w-10 rounded-lg" />
            <div className="skeleton h-4 w-16 rounded" />
          </div>
          <div className="skeleton h-8 w-24 rounded" />
          <div className="skeleton h-4 w-32 rounded" />
          {chart && <div className="skeleton h-16 w-full rounded" />}
        </div>
      </div>
    )
  }

  const getTrendIcon = () => {
    if (!trend) return null
    switch (trend.direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />
      case 'down':
        return <TrendingDown className="h-4 w-4" />
      default:
        return <Minus className="h-4 w-4" />
    }
  }

  const getTrendColor = () => {
    if (!trend) return ''
    switch (trend.direction) {
      case 'up':
        return 'text-success-600 bg-success-50 dark:bg-success-900/20'
      case 'down':
        return 'text-error-600 bg-error-50 dark:bg-error-900/20'
      default:
        return 'text-muted-foreground bg-muted'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`card p-6 hover-lift ${className}`}
    >
      <div className="space-y-4">
        {/* Header: Icon and Trend */}
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/20">
            <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>

          {trend && (
            <div
              className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${getTrendColor()}`}
            >
              {getTrendIcon()}
              <span>{trend.value > 0 ? '+' : ''}{trend.value}%</span>
            </div>
          )}
        </div>

        {/* Value */}
        <div>
          <div className="text-3xl font-bold tracking-tight text-foreground">
            {value}
          </div>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">
            {title}
          </h3>
          {trend?.label && (
            <p className="mt-1 text-xs text-muted-foreground/70">
              {trend.label}
            </p>
          )}
        </div>

        {/* Mini Chart */}
        {chart && (
          <div className="mt-4 h-16">
            {chart}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Skeleton version for explicit loading states
export function KPICardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`card p-6 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="skeleton h-10 w-10 rounded-lg" />
          <div className="skeleton h-4 w-16 rounded-full" />
        </div>
        <div className="skeleton h-8 w-24 rounded" />
        <div className="skeleton h-4 w-32 rounded" />
        <div className="skeleton h-16 w-full rounded" />
      </div>
    </div>
  )
}
