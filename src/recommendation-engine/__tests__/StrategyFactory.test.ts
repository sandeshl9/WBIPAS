/**
 * Strategy Factory Test Suite
 */

import { describe, it, expect } from 'vitest'
import { StrategyFactory } from '../strategies/StrategyFactory'
import { FIFORecommendationStrategy } from '../strategies/FIFORecommendationStrategy'
import { BalancedRecommendationStrategy } from '../strategies/BalancedRecommendationStrategy'
import { createTestContext, scenarioDifferentWorkloads } from '@/test/fixtures'

describe('StrategyFactory', () => {
  describe('getStrategy', () => {
    it('should return FIFO strategy', () => {
      const strategy = StrategyFactory.getStrategy('fifo')
      expect(strategy).toBeInstanceOf(FIFORecommendationStrategy)
    })

    it('should return Balanced strategy', () => {
      const strategy = StrategyFactory.getStrategy('balanced')
      expect(strategy).toBeInstanceOf(BalancedRecommendationStrategy)
    })

    it('should throw error for unknown strategy', () => {
      expect(() => {
        // @ts-expect-error Testing invalid type
        StrategyFactory.getStrategy('unknown')
      }).toThrow('Unknown strategy type')
    })
  })

  describe('getDefaultStrategy', () => {
    it('should return FIFO as default', () => {
      const strategy = StrategyFactory.getDefaultStrategy()
      expect(strategy).toBeInstanceOf(FIFORecommendationStrategy)
      expect(strategy.getName()).toBe('FIFO (Deterministic)')
    })
  })

  describe('getAllStrategies', () => {
    it('should return all registered strategies', () => {
      const strategies = StrategyFactory.getAllStrategies()
      
      expect(strategies).toHaveLength(4) // fifo, balanced, skill-based, ai
      expect(strategies.some(s => s.type === 'fifo')).toBe(true)
      expect(strategies.some(s => s.type === 'balanced')).toBe(true)
      expect(strategies.some(s => s.type === 'skill-based')).toBe(true)
      expect(strategies.some(s => s.type === 'ai')).toBe(true)
    })

    it('should indicate which strategies are available', () => {
      const strategies = StrategyFactory.getAllStrategies()
      
      const fifo = strategies.find(s => s.type === 'fifo')
      const balanced = strategies.find(s => s.type === 'balanced')
      const skillBased = strategies.find(s => s.type === 'skill-based')
      const ai = strategies.find(s => s.type === 'ai')
      
      expect(fifo?.available).toBe(true)
      expect(balanced?.available).toBe(true)
      expect(skillBased?.available).toBe(false)
      expect(ai?.available).toBe(false)
    })
  })

  describe('isStrategyAvailable', () => {
    it('should return true for implemented strategies', () => {
      expect(StrategyFactory.isStrategyAvailable('fifo')).toBe(true)
      expect(StrategyFactory.isStrategyAvailable('balanced')).toBe(true)
    })

    it('should return false for placeholder strategies', () => {
      expect(StrategyFactory.isStrategyAvailable('skill-based')).toBe(false)
      expect(StrategyFactory.isStrategyAvailable('ai')).toBe(false)
    })
  })

  describe('getStrategyInfo', () => {
    it('should return strategy metadata', () => {
      const info = StrategyFactory.getStrategyInfo('fifo')
      
      expect(info).toBeDefined()
      expect(info?.type).toBe('fifo')
      expect(info?.name).toBe('FIFO (Deterministic)')
      expect(info?.description).toBeDefined()
      expect(info?.available).toBe(true)
    })

    it('should return null for unknown strategy', () => {
      // @ts-expect-error Testing invalid type
      const info = StrategyFactory.getStrategyInfo('unknown')
      expect(info).toBeNull()
    })
  })

  describe('canHandleContext', () => {
    it('should validate context for FIFO strategy', () => {
      const context = createTestContext()
      const canHandle = StrategyFactory.canHandleContext('fifo', context)
      
      expect(canHandle).toBe(true)
    })

    it('should reject invalid context', () => {
      const context = createTestContext({ weekNumber: 100 })
      const canHandle = StrategyFactory.canHandleContext('fifo', context)
      
      expect(canHandle).toBe(false)
    })
  })

  describe('Strategy Behavior', () => {
    it('FIFO strategy should apply FIFO tie-breaking', () => {
      const strategy = StrategyFactory.getStrategy('fifo')
      const context = scenarioDifferentWorkloads()
      const result = strategy.recommend(context)
      
      expect(result).not.toBeNull()
      expect(result?.associate.name).toBe('Bob') // Lowest workload
    })

    it('Balanced strategy should skip FIFO', () => {
      const strategy = StrategyFactory.getStrategy('balanced')
      
      // Create scenario where FIFO would make a difference
      const { associates, workloadData } = require('@/test/fixtures').createAssociatesWithWorkload([
        { name: 'Zara', activeWorkload: 2, fifoDate: new Date('2024-06-01') },
        { name: 'Alice', activeWorkload: 2, fifoDate: new Date('2024-06-10') },
      ])

      const context = createTestContext({
        availableAssociates: associates,
        workloadData,
      })

      const result = strategy.recommend(context)
      
      // Balanced should use alphabetical, not FIFO
      expect(result).not.toBeNull()
      expect(result?.associate.name).toBe('Alice') // Alphabetically first
    })
  })
})
