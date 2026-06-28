/**
 * Assignment Engine Test Suite
 * 
 * Tests all 20+ scenarios from Volume 4 specification
 */

import { describe, it, expect } from 'vitest'
import { AssignmentEngine, ENGINE_VERSION } from '../AssignmentEngine'
import {
  createTestContext,
  scenarioEqualWorkload,
  scenarioDifferentWorkloads,
  scenarioFIFOTieBreaker,
  scenarioCapacityLimit,
  scenarioNoAvailableAssociates,
  scenarioAllAtCapacity,
  scenarioAvailabilityFiltering,
  createAssociatesWithWorkload,
} from '@/test/fixtures'

describe('AssignmentEngine', () => {
  describe('Basic Recommendation Flow', () => {
    it('should return null when no associates are available', () => {
      const context = scenarioNoAvailableAssociates()
      const result = AssignmentEngine.getRecommendation(context)
      
      expect(result).toBeNull()
    })

    it('should return null when all associates are at capacity', () => {
      const context = scenarioAllAtCapacity()
      const result = AssignmentEngine.getRecommendation(context)
      
      expect(result).toBeNull()
    })

    it('should recommend the only available associate', () => {
      const { associates, workloadData } = createAssociatesWithWorkload([
        { name: 'Alice', activeWorkload: 2, weeklyCount: 2 },
      ])

      const context = createTestContext({
        availableAssociates: associates,
        workloadData,
      })

      const result = AssignmentEngine.getRecommendation(context)
      
      expect(result).not.toBeNull()
      expect(result?.associate.name).toBe('Alice')
      expect(result?.engineVersion).toBe(ENGINE_VERSION)
    })

    it('should recommend associate with lowest workload', () => {
      const context = scenarioDifferentWorkloads()
      const result = AssignmentEngine.getRecommendation(context)
      
      expect(result).not.toBeNull()
      expect(result?.associate.name).toBe('Bob') // Workload: 3
      expect(result?.reason).toBe('lowest_workload')
      expect(result?.workloadBefore).toBe(3)
      expect(result?.workloadAfter).toBe(4)
    })
  })

  describe('Capacity Filtering', () => {
    it('should exclude associates at weekly capacity', () => {
      const context = scenarioCapacityLimit()
      const result = AssignmentEngine.getRecommendation(context)
      
      expect(result).not.toBeNull()
      expect(result?.associate.name).toBe('Bob') // Only one with capacity
    })

    it('should distinguish weekly capacity from active workload', () => {
      // Alice: 10 active projects (all weeks), but only 3 in current week
      // Bob: 5 active projects (all weeks), but 5 in current week (at capacity)
      const { associates, workloadData } = createAssociatesWithWorkload([
        { name: 'Alice', activeWorkload: 10, weeklyCount: 3 }, // Eligible
        { name: 'Bob', activeWorkload: 5, weeklyCount: 5 }, // At capacity
      ])

      const context = createTestContext({
        availableAssociates: associates,
        workloadData,
      })

      const result = AssignmentEngine.getRecommendation(context)
      
      // Alice should be selected despite higher overall workload
      expect(result).not.toBeNull()
      expect(result?.associate.name).toBe('Alice')
    })
  })

  describe('Availability Filtering', () => {
    it('should exclude associates on leave', () => {
      const context = scenarioAvailabilityFiltering()
      const result = AssignmentEngine.getRecommendation(context)
      
      // Only Alice is active and available
      expect(result).not.toBeNull()
      expect(result?.associate.name).toBe('Alice')
    })

    it('should exclude inactive associates', () => {
      const { associates, workloadData } = createAssociatesWithWorkload([
        { name: 'Alice', activeWorkload: 5 },
        { name: 'Bob', activeWorkload: 2 },
      ])

      associates[0].isActive = false // Alice inactive

      const context = createTestContext({
        availableAssociates: associates,
        workloadData,
      })

      const result = AssignmentEngine.getRecommendation(context)
      
      expect(result).not.toBeNull()
      expect(result?.associate.name).toBe('Bob')
    })
  })

  describe('FIFO Tie-Breaking', () => {
    it('should apply FIFO when workloads are equal', () => {
      const context = scenarioFIFOTieBreaker()
      const result = AssignmentEngine.getRecommendation(context)
      
      expect(result).not.toBeNull()
      expect(result?.associate.name).toBe('Bob') // Oldest project: 2024-06-05
      expect(result?.reason).toBe('fifo')
    })

    it('should use MIN(project_date) for FIFO', () => {
      const { associates, workloadData } = createAssociatesWithWorkload([
        { name: 'Alice', activeWorkload: 2, fifoDate: new Date('2024-06-01') }, // Oldest
        { name: 'Bob', activeWorkload: 2, fifoDate: new Date('2024-06-10') },
        { name: 'Charlie', activeWorkload: 2, fifoDate: new Date('2024-06-05') },
      ])

      const context = createTestContext({
        availableAssociates: associates,
        workloadData,
      })

      const result = AssignmentEngine.getRecommendation(context)
      
      expect(result).not.toBeNull()
      expect(result?.associate.name).toBe('Alice')
      expect(result?.reason).toBe('fifo')
    })

    it('should handle associates with no active projects (null FIFO date)', () => {
      const { associates, workloadData } = createAssociatesWithWorkload([
        { name: 'Alice', activeWorkload: 0, fifoDate: null },
        { name: 'Bob', activeWorkload: 0, fifoDate: null },
        { name: 'Charlie', activeWorkload: 0, fifoDate: null },
      ])

      const context = createTestContext({
        availableAssociates: associates,
        workloadData,
      })

      const result = AssignmentEngine.getRecommendation(context)
      
      // Should fall through to alphabetical
      expect(result).not.toBeNull()
      expect(result?.associate.name).toBe('Alice') // Alphabetically first
      expect(result?.reason).toBe('alphabetical')
    })
  })

  describe('Alphabetical Tie-Breaking', () => {
    it('should apply alphabetical order when workload and FIFO are equal', () => {
      const context = scenarioEqualWorkload()
      const result = AssignmentEngine.getRecommendation(context)
      
      expect(result).not.toBeNull()
      expect(result?.associate.name).toBe('Alice') // Alphabetically first
      expect(result?.reason).toBe('alphabetical')
    })

    it('should apply alphabetical when FIFO dates are identical', () => {
      const sameDate = new Date('2024-06-01')
      const { associates, workloadData } = createAssociatesWithWorkload([
        { name: 'Zara', activeWorkload: 2, fifoDate: sameDate },
        { name: 'Alice', activeWorkload: 2, fifoDate: sameDate },
        { name: 'Mike', activeWorkload: 2, fifoDate: sameDate },
      ])

      const context = createTestContext({
        availableAssociates: associates,
        workloadData,
      })

      const result = AssignmentEngine.getRecommendation(context)
      
      expect(result).not.toBeNull()
      expect(result?.associate.name).toBe('Alice')
      expect(result?.reason).toBe('alphabetical')
    })
  })

  describe('Explanation Generation', () => {
    it('should generate structured explanation', () => {
      const context = scenarioDifferentWorkloads()
      const result = AssignmentEngine.getRecommendation(context)
      
      expect(result).not.toBeNull()
      expect(result?.explanation).toBeDefined()
      expect(result?.explanation.reasons).toBeInstanceOf(Array)
      expect(result?.explanation.reasons.length).toBeGreaterThan(0)
      expect(result?.explanation.workload).toBe(3)
      expect(result?.explanation.capacity).toBe(5)
      expect(result?.explanation.remainingCapacity).toBe(2)
    })

    it('should include text explanation', () => {
      const context = scenarioDifferentWorkloads()
      const result = AssignmentEngine.getRecommendation(context)
      
      expect(result).not.toBeNull()
      expect(result?.explanationText).toBeDefined()
      expect(typeof result?.explanationText).toBe('string')
      expect(result?.explanationText.length).toBeGreaterThan(0)
    })
  })

  describe('Top Candidates Preview', () => {
    it('should return top 5 ranked candidates', () => {
      const { associates, workloadData } = createAssociatesWithWorkload([
        { name: 'Alice', activeWorkload: 1 },
        { name: 'Bob', activeWorkload: 2 },
        { name: 'Charlie', activeWorkload: 3 },
        { name: 'David', activeWorkload: 4 },
        { name: 'Eve', activeWorkload: 5 },
        { name: 'Frank', activeWorkload: 6 },
      ])

      const context = createTestContext({
        availableAssociates: associates,
        workloadData,
      })

      const ranked = AssignmentEngine.getTopCandidates(context, 5)
      
      expect(ranked).toHaveLength(5)
      expect(ranked[0].rank).toBe(1)
      expect(ranked[0].associate.name).toBe('Alice')
      expect(ranked[4].rank).toBe(5)
      expect(ranked[4].associate.name).toBe('Eve')
    })

    it('should return empty array when no eligible candidates', () => {
      const context = scenarioNoAvailableAssociates()
      const ranked = AssignmentEngine.getTopCandidates(context)
      
      expect(ranked).toHaveLength(0)
    })

    it('should rank by workload, then FIFO, then alphabetical', () => {
      const { associates, workloadData } = createAssociatesWithWorkload([
        { name: 'Charlie', activeWorkload: 2, fifoDate: new Date('2024-06-05') },
        { name: 'Alice', activeWorkload: 2, fifoDate: new Date('2024-06-01') },
        { name: 'Bob', activeWorkload: 1, fifoDate: new Date('2024-06-10') },
      ])

      const context = createTestContext({
        availableAssociates: associates,
        workloadData,
      })

      const ranked = AssignmentEngine.getTopCandidates(context)
      
      // Bob (lowest workload), Alice (same workload, older FIFO), Charlie
      expect(ranked[0].associate.name).toBe('Bob')
      expect(ranked[1].associate.name).toBe('Alice')
      expect(ranked[2].associate.name).toBe('Charlie')
    })
  })

  describe('Bulk Assignment Simulation', () => {
    it('should simulate sequential assignment', () => {
      const { associates, workloadData } = createAssociatesWithWorkload([
        { name: 'Alice', activeWorkload: 0 },
        { name: 'Bob', activeWorkload: 0 },
        { name: 'Charlie', activeWorkload: 0 },
      ])

      const context = createTestContext({
        availableAssociates: associates,
        workloadData,
      })

      const projects = [
        { date: new Date('2024-06-15') },
        { date: new Date('2024-06-16') },
        { date: new Date('2024-06-17') },
      ]

      const simulation = AssignmentEngine.simulateDistribution(projects, context)
      
      expect(simulation.assignments).toHaveLength(3)
      expect(simulation.failedAssignments).toBe(0)
      
      // Should distribute evenly (Alice, Bob, Charlie)
      expect(simulation.assignments[0].associateName).toBe('Alice')
      expect(simulation.assignments[1].associateName).toBe('Bob')
      expect(simulation.assignments[2].associateName).toBe('Charlie')
    })

    it('should recalculate after each assignment', () => {
      const { associates, workloadData } = createAssociatesWithWorkload([
        { name: 'Alice', activeWorkload: 0 },
        { name: 'Bob', activeWorkload: 0 },
      ])

      const context = createTestContext({
        availableAssociates: associates,
        workloadData,
      })

      const projects = Array.from({ length: 4 }, (_, i) => ({
        date: new Date(`2024-06-${15 + i}`),
      }))

      const simulation = AssignmentEngine.simulateDistribution(projects, context)
      
      // Should alternate: Alice, Bob, Alice, Bob
      expect(simulation.assignments[0].associateName).toBe('Alice')
      expect(simulation.assignments[1].associateName).toBe('Bob')
      expect(simulation.assignments[2].associateName).toBe('Alice')
      expect(simulation.assignments[3].associateName).toBe('Bob')

      // Final distribution
      const aliceCount = simulation.distributionSummary.find(d => d.associateName === 'Alice')?.projectsAssigned
      const bobCount = simulation.distributionSummary.find(d => d.associateName === 'Bob')?.projectsAssigned
      
      expect(aliceCount).toBe(2)
      expect(bobCount).toBe(2)
    })

    it('should calculate fairness metrics', () => {
      const { associates, workloadData } = createAssociatesWithWorkload([
        { name: 'Alice', activeWorkload: 0 },
        { name: 'Bob', activeWorkload: 0 },
        { name: 'Charlie', activeWorkload: 0 },
      ])

      const context = createTestContext({
        availableAssociates: associates,
        workloadData,
      })

      const projects = Array.from({ length: 9 }, (_, i) => ({
        date: new Date(`2024-06-${15 + i}`),
      }))

      const simulation = AssignmentEngine.simulateDistribution(projects, context)
      
      expect(simulation.fairnessMetrics).toBeDefined()
      expect(simulation.fairnessMetrics.standardDeviation).toBeDefined()
      expect(simulation.fairnessMetrics.balanceScore).toBeDefined()
      expect(simulation.fairnessMetrics.balanceScore).toBeGreaterThan(80) // Should be well-balanced
    })
  })

  describe('Context Validation', () => {
    it('should validate required fields', () => {
      const context = createTestContext()
      const validation = AssignmentEngine.validateContext(context)
      
      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should reject invalid week number', () => {
      const context = createTestContext({ weekNumber: 54 })
      const validation = AssignmentEngine.validateContext(context)
      
      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('Invalid week number')
    })

    it('should reject invalid year', () => {
      const context = createTestContext({ year: 2150 })
      const validation = AssignmentEngine.validateContext(context)
      
      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('Invalid year')
    })

    it('should reject empty associates list', () => {
      const context = createTestContext({ availableAssociates: [] })
      const validation = AssignmentEngine.validateContext(context)
      
      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('No associates available')
    })
  })

  describe('Engine Metadata', () => {
    it('should include engine version in results', () => {
      const context = scenarioDifferentWorkloads()
      const result = AssignmentEngine.getRecommendation(context)
      
      expect(result).not.toBeNull()
      expect(result?.engineVersion).toBe(ENGINE_VERSION)
    })

    it('should provide engine info', () => {
      const info = AssignmentEngine.getEngineInfo()
      
      expect(info.version).toBe(ENGINE_VERSION)
      expect(info.algorithm).toBeDefined()
      expect(info.steps).toBeInstanceOf(Array)
      expect(info.steps.length).toBe(11)
    })
  })

  describe('Edge Cases', () => {
    it('should handle single associate scenario', () => {
      const { associates, workloadData } = createAssociatesWithWorkload([
        { name: 'Alice', activeWorkload: 3, weeklyCount: 3 },
      ])

      const context = createTestContext({
        availableAssociates: associates,
        workloadData,
      })

      const result = AssignmentEngine.getRecommendation(context)
      
      expect(result).not.toBeNull()
      expect(result?.associate.name).toBe('Alice')
    })

    it('should handle zero workload across all associates', () => {
      const { associates, workloadData } = createAssociatesWithWorkload([
        { name: 'Zara', activeWorkload: 0 },
        { name: 'Alice', activeWorkload: 0 },
        { name: 'Mike', activeWorkload: 0 },
      ])

      const context = createTestContext({
        availableAssociates: associates,
        workloadData,
      })

      const result = AssignmentEngine.getRecommendation(context)
      
      // Should select alphabetically
      expect(result).not.toBeNull()
      expect(result?.associate.name).toBe('Alice')
    })

    it('should handle maximum workload scenario', () => {
      const { associates, workloadData } = createAssociatesWithWorkload([
        { name: 'Alice', activeWorkload: 100, weeklyCount: 4 },
        { name: 'Bob', activeWorkload: 50, weeklyCount: 3 },
      ])

      const context = createTestContext({
        availableAssociates: associates,
        workloadData,
      })

      const result = AssignmentEngine.getRecommendation(context)
      
      // Bob has lower active workload
      expect(result).not.toBeNull()
      expect(result?.associate.name).toBe('Bob')
    })
  })
})
