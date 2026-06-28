/**
 * RECOMMENDATION CARD - Volume 5 Component
 * 
 * The most polished component in WBIPAS
 * Shows recommended associate with reasoning, ranking, and actions
 * 
 * Inspired by: Linear's intelligent suggestions, Stripe's smart recommendations
 */

import React from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  User,
  TrendingDown,
  Calendar,
  ArrowRight,
  AlertCircle,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge, CapacityBadge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import type { RecommendationResult, RankedRecommendation } from '@/recommendation-engine'

export interface RecommendationCardProps {
  recommendation: RecommendationResult
  topCandidates?: RankedRecommendation[]
  onAssign: (associateId: string) => void
  onOverride: () => void
  loading?: boolean
  className?: string
}

export function RecommendationCard({
  recommendation,
  topCandidates = [],
  onAssign,
  onOverride,
  loading = false,
  className,
}: RecommendationCardProps) {
  const { associate, explanation, workloadBefore, workloadAfter, reason, engineVersion } =
    recommendation

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn('card overflow-hidden border-2 border-primary-200 dark:border-primary-900', className)}
    >
      {/* Header Badge */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-950 dark:to-primary-900 px-6 py-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          <span className="text-sm font-semibold text-primary-900 dark:text-primary-100">
            ✓ Recommended Associate
          </span>
          <div className="ml-auto">
            <Badge variant="info" size="sm">
              Engine v{engineVersion}
            </Badge>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Associate Details */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
              <User className="h-7 w-7 text-primary-600 dark:text-primary-400" />
            </div>

            {/* Info */}
            <div>
              <h3 className="text-xl font-bold text-foreground">
                {associate.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {associate.email}
              </p>
            </div>
          </div>

          {/* Workload Summary */}
          <div className="text-right">
            <CapacityBadge
              current={workloadBefore}
              total={associate.weeklyCapacity}
              className="text-base px-3 py-1.5"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Current Workload
            </p>
          </div>
        </div>

        {/* Workload Metrics */}
        <div className="grid grid-cols-3 gap-4 rounded-lg bg-muted/50 p-4">
          <div>
            <p className="text-xs text-muted-foreground">Current</p>
            <p className="text-2xl font-bold text-foreground">{workloadBefore}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">After Assignment</p>
            <p className="text-2xl font-bold text-primary-600">{workloadAfter}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Remaining Capacity</p>
            <p className="text-2xl font-bold text-success-600">
              {explanation.remainingCapacity}
            </p>
          </div>
        </div>

        {/* Reasons */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Info className="h-4 w-4 text-primary-600" />
            <h4 className="text-sm font-semibold text-foreground">Why {associate.name}?</h4>
          </div>

          <div className="space-y-2">
            {explanation.reasons.map((reasonText, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 rounded-lg bg-success-50 dark:bg-success-900/10 px-4 py-3"
              >
                <CheckCircle2 className="h-4 w-4 text-success-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-foreground">{reasonText}</span>
              </motion.div>
            ))}
          </div>

          {/* FIFO Date if applicable */}
          {explanation.fifoDate && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Oldest project: {new Date(explanation.fifoDate).toLocaleDateString()}
              </span>
            </div>
          )}

          {/* Tied Candidates */}
          {explanation.tiedCandidates && explanation.tiedCandidates > 1 && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>Selected from {explanation.tiedCandidates} tied candidates</span>
            </div>
          )}
        </div>

        {/* Other Eligible Associates */}
        {topCandidates.length > 1 && (
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">
              Other Eligible Associates
            </h4>
            <div className="space-y-2">
              {topCandidates.slice(1, 4).map((candidate) => (
                <div
                  key={candidate.associate.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                      {candidate.rank}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {candidate.associate.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Workload: {candidate.workloadBefore} projects
                      </p>
                    </div>
                  </div>
                  <Badge variant="neutral" size="sm">
                    Score: {candidate.score}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={() => onAssign(associate.id)}
            loading={loading}
            icon={ArrowRight}
            iconPosition="right"
            className="flex-1"
          >
            Assign to {associate.name}
          </Button>
          <Button
            onClick={onOverride}
            variant="secondary"
            disabled={loading}
          >
            Override
          </Button>
        </div>

        {/* Footer Note */}
        <div className="rounded-lg bg-info-50 dark:bg-info-900/10 px-4 py-3">
          <p className="text-xs text-info-900 dark:text-info-100">
            <strong>Algorithm:</strong> This recommendation follows the deterministic FIFO algorithm 
            with capacity balancing. {reason === 'fifo' && 'FIFO tie-breaker was applied based on oldest active project date.'}
            {reason === 'alphabetical' && 'Alphabetical tie-breaker was applied after workload and FIFO comparison.'}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// No Recommendation Available Card
export function NoRecommendationCard({
  reason,
  onAction,
  className,
}: {
  reason: string
  onAction?: () => void
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn('card overflow-hidden border-2 border-warning-200 dark:border-warning-900', className)}
    >
      <div className="bg-gradient-to-r from-warning-50 to-warning-100 dark:from-warning-950 dark:to-warning-900 px-6 py-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-warning-600 dark:text-warning-400" />
          <span className="text-sm font-semibold text-warning-900 dark:text-warning-100">
            No Recommendation Available
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-warning-100 dark:bg-warning-900/30">
            <AlertCircle className="h-7 w-7 text-warning-600 dark:text-warning-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Unable to Generate Recommendation
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {reason}
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-warning-50 dark:bg-warning-900/10 px-4 py-3">
          <p className="text-sm text-warning-900 dark:text-warning-100">
            <strong>Possible Solutions:</strong>
          </p>
          <ul className="mt-2 space-y-1 text-sm text-warning-900 dark:text-warning-100 list-disc list-inside">
            <li>Check if associates are marked as available</li>
            <li>Verify weekly capacity limits</li>
            <li>Review associate availability status</li>
            <li>Adjust project date if needed</li>
          </ul>
        </div>

        {onAction && (
          <Button onClick={onAction} variant="secondary" fullWidth>
            View All Associates
          </Button>
        )}
      </div>
    </motion.div>
  )
}

// Loading State for Recommendation Card
export function RecommendationCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('card p-6', className)}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="skeleton h-14 w-14 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-6 w-48" />
            <div className="skeleton h-4 w-64" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-lg" />
          ))}
        </div>

        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-12 rounded-lg" />
          ))}
        </div>

        <div className="flex gap-3">
          <div className="skeleton h-10 flex-1 rounded-lg" />
          <div className="skeleton h-10 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
