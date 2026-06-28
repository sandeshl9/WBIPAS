/**
 * ASSIGNMENT SIMULATOR - Volume 5 Component
 * 
 * Enterprise feature: Preview workload distribution before committing
 * Managers can validate fairness metrics and distribution before assignment
 * 
 * This is what differentiates WBIPAS from a simple assignment tool
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Download,
  X,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import type { SimulationResult } from '@/recommendation-engine'

export interface AssignmentSimulatorProps {
  projectCount: number
  onSimulate: () => Promise<SimulationResult>
  onConfirm: () => Promise<void>
  onCancel: () => void
  className?: string
}

export function AssignmentSimulator({
  projectCount,
  onSimulate,
  onConfirm,
  onCancel,
  className,
}: AssignmentSimulatorProps) {
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)

  const handleSimulate = async () => {
    setIsSimulating(true)
    try {
      const result = await onSimulate()
      setSimulationResult(result)
    } catch (error) {
      console.error('Simulation failed:', error)
    } finally {
      setIsSimulating(false)
    }
  }

  const handleConfirm = async () => {
    setIsConfirming(true)
    try {
      await onConfirm()
    } finally {
      setIsConfirming(false)
    }
  }

  const getFairnessLevel = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'success' as const }
    if (score >= 80) return { label: 'Good', color: 'info' as const }
    if (score >= 70) return { label: 'Fair', color: 'warning' as const }
    return { label: 'Poor', color: 'error' as const }
  }

  return (
    <div className={cn('card overflow-hidden', className)}>
      {/* Header */}
      <div className="border-b border-border bg-muted/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/20">
              <BarChart3 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Assignment Simulator
              </h3>
              <p className="text-sm text-muted-foreground">
                Preview workload distribution for {projectCount} projects
              </p>
            </div>
          </div>
          <Button
            onClick={onCancel}
            variant="ghost"
            icon={X}
            aria-label="Close simulator"
          />
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Initial State */}
        {!simulationResult && !isSimulating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/20">
                <Play className="h-10 w-10 text-primary-600 dark:text-primary-400" />
              </div>
            </div>

            <h4 className="text-lg font-semibold text-foreground mb-2">
              Ready to Simulate
            </h4>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Run a simulation to see how the recommendation engine will distribute 
              these {projectCount} projects across available associates.
            </p>

            <div className="rounded-lg bg-info-50 dark:bg-info-900/10 px-4 py-3 text-left max-w-md mx-auto mb-6">
              <div className="flex gap-2">
                <Info className="h-4 w-4 text-info-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-info-900 dark:text-info-100">
                  <p className="font-medium mb-1">What this simulation shows:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Workload distribution before and after</li>
                    <li>Fairness metrics and balance score</li>
                    <li>Assignment success rate</li>
                    <li>Detailed breakdown per associate</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSimulate}
              icon={Play}
              size="lg"
            >
              Run Simulation
            </Button>
          </motion.div>
        )}

        {/* Loading State */}
        {isSimulating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="mb-6 flex justify-center">
              <div className="h-20 w-20 rounded-full border-4 border-primary-100 border-t-primary-600 animate-spin" />
            </div>
            <h4 className="text-lg font-semibold text-foreground mb-2">
              Running Simulation...
            </h4>
            <p className="text-sm text-muted-foreground">
              Processing {projectCount} projects through recommendation engine
            </p>
          </motion.div>
        )}

        {/* Simulation Results */}
        {simulationResult && !isSimulating && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Success Rate */}
              <div className="grid grid-cols-3 gap-4">
                <div className="card p-4">
                  <p className="text-xs text-muted-foreground mb-1">Success Rate</p>
                  <p className="text-2xl font-bold text-foreground">
                    {Math.round(
                      ((simulationResult.assignments.length - simulationResult.failedAssignments) /
                        simulationResult.assignments.length) *
                        100
                    )}
                    %
                  </p>
                  <p className="text-xs text-success-600 mt-1">
                    {simulationResult.assignments.length - simulationResult.failedAssignments} successful
                  </p>
                </div>

                <div className="card p-4">
                  <p className="text-xs text-muted-foreground mb-1">Balance Score</p>
                  <p className="text-2xl font-bold text-foreground">
                    {simulationResult.fairnessMetrics.balanceScore.toFixed(1)}
                  </p>
                  <Badge
                    variant={getFairnessLevel(simulationResult.fairnessMetrics.balanceScore).color}
                    size="sm"
                    className="mt-1"
                  >
                    {getFairnessLevel(simulationResult.fairnessMetrics.balanceScore).label}
                  </Badge>
                </div>

                <div className="card p-4">
                  <p className="text-xs text-muted-foreground mb-1">Std. Deviation</p>
                  <p className="text-2xl font-bold text-foreground">
                    {simulationResult.fairnessMetrics.standardDeviation.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Lower is better
                  </p>
                </div>
              </div>

              {/* Fairness Metrics */}
              <div className="card p-4 bg-muted/30">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-4 w-4 text-primary-600" />
                  <h4 className="text-sm font-semibold text-foreground">
                    Fairness Metrics
                  </h4>
                </div>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Min</p>
                    <p className="text-lg font-semibold text-foreground">
                      {simulationResult.fairnessMetrics.minWorkload}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Average</p>
                    <p className="text-lg font-semibold text-foreground">
                      {simulationResult.fairnessMetrics.averageWorkload.toFixed(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Max</p>
                    <p className="text-lg font-semibold text-foreground">
                      {simulationResult.fairnessMetrics.maxWorkload}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Gini</p>
                    <p className="text-lg font-semibold text-foreground">
                      {simulationResult.fairnessMetrics.giniCoefficient.toFixed(3)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Distribution Summary */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">
                  Distribution Summary
                </h4>
                <div className="space-y-2">
                  {simulationResult.distributionSummary
                    .sort((a, b) => b.finalWorkload - a.finalWorkload)
                    .map((summary) => {
                      const percentage =
                        summary.finalWorkload > 0
                          ? (summary.projectsAssigned / summary.finalWorkload) * 100
                          : 0

                      return (
                        <div
                          key={summary.associateId}
                          className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">
                              {summary.associateName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              +{summary.projectsAssigned} new · Final workload: {summary.finalWorkload}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="text-sm font-semibold text-foreground">
                                {summary.projectsAssigned}
                              </p>
                              <p className="text-xs text-muted-foreground">assigned</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <div className="text-right">
                              <p className="text-sm font-semibold text-primary-600">
                                {summary.finalWorkload}
                              </p>
                              <p className="text-xs text-muted-foreground">total</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>

              {/* Failed Assignments Warning */}
              {simulationResult.failedAssignments > 0 && (
                <div className="rounded-lg bg-warning-50 dark:bg-warning-900/10 border border-warning-200 dark:border-warning-800 px-4 py-3">
                  <div className="flex gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-warning-900 dark:text-warning-100">
                        {simulationResult.failedAssignments} projects could not be assigned
                      </p>
                      <p className="text-xs text-warning-800 dark:text-warning-200 mt-1">
                        This typically means all associates are at capacity or unavailable
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Good Balance Indicator */}
              {simulationResult.fairnessMetrics.balanceScore >= 80 && (
                <div className="rounded-lg bg-success-50 dark:bg-success-900/10 border border-success-200 dark:border-success-800 px-4 py-3">
                  <div className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-success-900 dark:text-success-100">
                        Excellent workload balance
                      </p>
                      <p className="text-xs text-success-800 dark:text-success-200 mt-1">
                        This distribution ensures fair workload across all associates
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button
                  onClick={handleConfirm}
                  loading={isConfirming}
                  icon={CheckCircle2}
                  size="lg"
                  className="flex-1"
                >
                  Confirm & Assign All
                </Button>
                <Button
                  onClick={() => setSimulationResult(null)}
                  variant="secondary"
                  disabled={isConfirming}
                >
                  Run Again
                </Button>
                <Button
                  onClick={onCancel}
                  variant="ghost"
                  disabled={isConfirming}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 7l5 5m0 0l-5 5m5-5H6"
      />
    </svg>
  )
}
