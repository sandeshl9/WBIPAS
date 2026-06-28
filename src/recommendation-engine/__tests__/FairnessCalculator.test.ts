/**
 * Fairness Calculator Test Suite
 */

import { describe, it, expect } from 'vitest'
import { FairnessCalculator } from '../FairnessCalculator'

describe('FairnessCalculator', () => {
  describe('calculateMetrics', () => {
    it('should return perfect balance for equal workloads', () => {
      const workloads = [5, 5, 5, 5]
      const metrics = FairnessCalculator.calculateMetrics(workloads)
      
      expect(metrics.standardDeviation).toBe(0)
      expect(metrics.balanceScore).toBe(100)
      expect(metrics.minWorkload).toBe(5)
      expect(metrics.maxWorkload).toBe(5)
      expect(metrics.averageWorkload).toBe(5)
      expect(metrics.giniCoefficient).toBe(0)
    })

    it('should handle empty workload array', () => {
      const metrics = FairnessCalculator.calculateMetrics([])
      
      expect(metrics.standardDeviation).toBe(0)
      expect(metrics.balanceScore).toBe(100)
      expect(metrics.minWorkload).toBe(0)
      expect(metrics.maxWorkload).toBe(0)
      expect(metrics.averageWorkload).toBe(0)
      expect(metrics.giniCoefficient).toBe(0)
    })

    it('should calculate correct metrics for unbalanced distribution', () => {
      const workloads = [1, 3, 5, 7, 9]
      const metrics = FairnessCalculator.calculateMetrics(workloads)
      
      expect(metrics.minWorkload).toBe(1)
      expect(metrics.maxWorkload).toBe(9)
      expect(metrics.averageWorkload).toBe(5)
      expect(metrics.standardDeviation).toBeGreaterThan(0)
      expect(metrics.balanceScore).toBeLessThan(100)
      expect(metrics.giniCoefficient).toBeGreaterThan(0)
      expect(metrics.giniCoefficient).toBeLessThan(1)
    })

    it('should calculate standard deviation correctly', () => {
      const workloads = [2, 4, 4, 4, 5, 5, 7, 9]
      const metrics = FairnessCalculator.calculateMetrics(workloads)
      const expectedMean = 5
      
      expect(metrics.averageWorkload).toBe(expectedMean)
      expect(metrics.standardDeviation).toBeGreaterThan(0)
      expect(metrics.standardDeviation).toBeCloseTo(2, 0)
    })
  })

  describe('calculateBalanceScore', () => {
    it('should return 100 for perfect balance', () => {
      const score = FairnessCalculator.calculateBalanceScore([5, 5, 5, 5])
      expect(score).toBe(100)
    })

    it('should return lower score for imbalanced distribution', () => {
      const score = FairnessCalculator.calculateBalanceScore([1, 5, 10])
      expect(score).toBeLessThan(100)
      expect(score).toBeGreaterThan(0)
    })

    it('should handle single workload', () => {
      const score = FairnessCalculator.calculateBalanceScore([5])
      expect(score).toBe(100)
    })

    it('should handle extreme imbalance', () => {
      const score = FairnessCalculator.calculateBalanceScore([0, 0, 100])
      expect(score).toBeLessThan(50)
    })
  })

  describe('calculateGiniCoefficient', () => {
    it('should return 0 for perfect equality', () => {
      const gini = FairnessCalculator.calculateGiniCoefficient([5, 5, 5, 5])
      expect(gini).toBe(0)
    })

    it('should return value between 0 and 1 for unequal distribution', () => {
      const gini = FairnessCalculator.calculateGiniCoefficient([1, 2, 3, 4, 5])
      expect(gini).toBeGreaterThan(0)
      expect(gini).toBeLessThan(1)
    })

    it('should handle all-zero workloads', () => {
      const gini = FairnessCalculator.calculateGiniCoefficient([0, 0, 0])
      expect(gini).toBe(0)
    })

    it('should handle extreme inequality', () => {
      const gini = FairnessCalculator.calculateGiniCoefficient([0, 0, 0, 100])
      expect(gini).toBeGreaterThan(0.5)
    })
  })

  describe('isFairDistribution', () => {
    it('should return true for balanced distribution', () => {
      const metrics = FairnessCalculator.calculateMetrics([5, 5, 6, 6])
      expect(FairnessCalculator.isFairDistribution(metrics, 80)).toBe(true)
    })

    it('should return false for imbalanced distribution', () => {
      const metrics = FairnessCalculator.calculateMetrics([1, 10, 20])
      expect(FairnessCalculator.isFairDistribution(metrics, 80)).toBe(false)
    })

    it('should respect custom threshold', () => {
      const metrics = FairnessCalculator.calculateMetrics([4, 5, 6])
      expect(FairnessCalculator.isFairDistribution(metrics, 90)).toBe(true)
      expect(FairnessCalculator.isFairDistribution(metrics, 99)).toBe(false)
    })
  })

  describe('getFairnessAssessment', () => {
    it('should return excellent for high balance score', () => {
      const metrics = FairnessCalculator.calculateMetrics([5, 5, 5, 6])
      const assessment = FairnessCalculator.getFairnessAssessment(metrics)
      
      expect(assessment.level).toBe('excellent')
      expect(assessment.message).toContain('excellent')
    })

    it('should return good for moderate balance score', () => {
      const metrics = FairnessCalculator.calculateMetrics([3, 5, 6, 7])
      const assessment = FairnessCalculator.getFairnessAssessment(metrics)
      
      expect(['excellent', 'good']).toContain(assessment.level)
    })

    it('should return poor for low balance score', () => {
      const metrics = FairnessCalculator.calculateMetrics([1, 5, 15, 20])
      const assessment = FairnessCalculator.getFairnessAssessment(metrics)
      
      expect(['fair', 'poor']).toContain(assessment.level)
    })
  })

  describe('compareFairness', () => {
    it('should identify better distribution', () => {
      const metrics1 = FairnessCalculator.calculateMetrics([5, 5, 6])
      const metrics2 = FairnessCalculator.calculateMetrics([1, 5, 10])
      const comparison = FairnessCalculator.compareFairness(metrics1, metrics2)
      
      expect(comparison.better).toBe('first')
      expect(comparison.difference).toBeGreaterThan(0)
    })

    it('should identify equal distributions', () => {
      const metrics1 = FairnessCalculator.calculateMetrics([5, 5, 5])
      const metrics2 = FairnessCalculator.calculateMetrics([5, 5, 5])
      const comparison = FairnessCalculator.compareFairness(metrics1, metrics2)
      
      expect(comparison.better).toBe('equal')
      expect(comparison.difference).toBe(0)
    })

    it('should identify second as better', () => {
      const metrics1 = FairnessCalculator.calculateMetrics([1, 10, 20])
      const metrics2 = FairnessCalculator.calculateMetrics([8, 9, 10])
      const comparison = FairnessCalculator.compareFairness(metrics1, metrics2)
      
      expect(comparison.better).toBe('second')
      expect(comparison.difference).toBeGreaterThan(0)
    })
  })
})
