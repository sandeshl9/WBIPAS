/**
 * Test Fixtures
 * 
 * Reusable test data for recommendation engine tests
 */

import type { Associate, WorkloadData, RecommendationContext } from '@/recommendation-engine/types'

/**
 * Create a test associate
 */
export function createTestAssociate(
  overrides: Partial<Associate> = {}
): Associate {
  return {
    id: 'assoc-1',
    name: 'John Doe',
    email: 'john@example.com',
    weeklyCapacity: 5,
    isActive: true,
    availabilityStatus: 'available',
    ...overrides,
  }
}

/**
 * Create multiple test associates
 */
export function createTestAssociates(count: number): Associate[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `assoc-${i + 1}`,
    name: `Associate ${String.fromCharCode(65 + i)}`, // A, B, C, etc.
    email: `associate${i + 1}@example.com`,
    weeklyCapacity: 5,
    isActive: true,
    availabilityStatus: 'available' as const,
  }))
}

/**
 * Create test workload data
 */
export function createTestWorkloadData(
  overrides: Partial<WorkloadData> = {}
): WorkloadData {
  return {
    associateId: 'assoc-1',
    activeProjectCount: 0,
    weeklyAssignedCount: 0,
    oldestProjectDate: null,
    ...overrides,
  }
}

/**
 * Create test recommendation context
 */
export function createTestContext(
  overrides: Partial<RecommendationContext> = {}
): RecommendationContext {
  return {
    projectDate: new Date('2024-06-15'),
    weekNumber: 24,
    year: 2024,
    availableAssociates: createTestAssociates(3),
    workloadData: [
      { associateId: 'assoc-1', activeProjectCount: 0, weeklyAssignedCount: 0, oldestProjectDate: null },
      { associateId: 'assoc-2', activeProjectCount: 0, weeklyAssignedCount: 0, oldestProjectDate: null },
      { associateId: 'assoc-3', activeProjectCount: 0, weeklyAssignedCount: 0, oldestProjectDate: null },
    ],
    ...overrides,
  }
}

/**
 * Create associates with specific workload distribution
 */
export function createAssociatesWithWorkload(
  workloads: Array<{ name: string; activeWorkload: number; weeklyCount?: number; fifoDate?: Date | null }>
): { associates: Associate[]; workloadData: WorkloadData[] } {
  const associates: Associate[] = []
  const workloadData: WorkloadData[] = []

  workloads.forEach((config, index) => {
    const id = `assoc-${index + 1}`
    
    associates.push({
      id,
      name: config.name,
      email: `${config.name.toLowerCase().replace(' ', '')}@example.com`,
      weeklyCapacity: 5,
      isActive: true,
      availabilityStatus: 'available',
    })

    workloadData.push({
      associateId: id,
      activeProjectCount: config.activeWorkload,
      weeklyAssignedCount: config.weeklyCount ?? config.activeWorkload,
      oldestProjectDate: config.fifoDate ?? null,
    })
  })

  return { associates, workloadData }
}

/**
 * Test scenario: Equal workload, no FIFO dates
 */
export function scenarioEqualWorkload(): RecommendationContext {
  const { associates, workloadData } = createAssociatesWithWorkload([
    { name: 'Charlie', activeWorkload: 2 },
    { name: 'Alice', activeWorkload: 2 },
    { name: 'Bob', activeWorkload: 2 },
  ])

  return {
    projectDate: new Date('2024-06-15'),
    weekNumber: 24,
    year: 2024,
    availableAssociates: associates,
    workloadData,
  }
}

/**
 * Test scenario: Different workloads
 */
export function scenarioDifferentWorkloads(): RecommendationContext {
  const { associates, workloadData } = createAssociatesWithWorkload([
    { name: 'Alice', activeWorkload: 5 },
    { name: 'Bob', activeWorkload: 3 },
    { name: 'Charlie', activeWorkload: 4 },
  ])

  return {
    projectDate: new Date('2024-06-15'),
    weekNumber: 24,
    year: 2024,
    availableAssociates: associates,
    workloadData,
  }
}

/**
 * Test scenario: FIFO tie-breaker needed
 */
export function scenarioFIFOTieBreaker(): RecommendationContext {
  const { associates, workloadData } = createAssociatesWithWorkload([
    { name: 'Alice', activeWorkload: 2, fifoDate: new Date('2024-06-10') },
    { name: 'Bob', activeWorkload: 2, fifoDate: new Date('2024-06-05') }, // Oldest
    { name: 'Charlie', activeWorkload: 2, fifoDate: new Date('2024-06-08') },
  ])

  return {
    projectDate: new Date('2024-06-15'),
    weekNumber: 24,
    year: 2024,
    availableAssociates: associates,
    workloadData,
  }
}

/**
 * Test scenario: Capacity limit reached
 */
export function scenarioCapacityLimit(): RecommendationContext {
  const { associates, workloadData } = createAssociatesWithWorkload([
    { name: 'Alice', activeWorkload: 5, weeklyCount: 5 }, // At capacity
    { name: 'Bob', activeWorkload: 3, weeklyCount: 3 }, // Available
    { name: 'Charlie', activeWorkload: 5, weeklyCount: 5 }, // At capacity
  ])

  return {
    projectDate: new Date('2024-06-15'),
    weekNumber: 24,
    year: 2024,
    availableAssociates: associates,
    workloadData,
  }
}

/**
 * Test scenario: No available associates
 */
export function scenarioNoAvailableAssociates(): RecommendationContext {
  return {
    projectDate: new Date('2024-06-15'),
    weekNumber: 24,
    year: 2024,
    availableAssociates: [],
    workloadData: [],
  }
}

/**
 * Test scenario: All at capacity
 */
export function scenarioAllAtCapacity(): RecommendationContext {
  const { associates, workloadData } = createAssociatesWithWorkload([
    { name: 'Alice', activeWorkload: 8, weeklyCount: 5 },
    { name: 'Bob', activeWorkload: 10, weeklyCount: 5 },
    { name: 'Charlie', activeWorkload: 7, weeklyCount: 5 },
  ])

  return {
    projectDate: new Date('2024-06-15'),
    weekNumber: 24,
    year: 2024,
    availableAssociates: associates,
    workloadData,
  }
}

/**
 * Test scenario: Availability status filtering
 */
export function scenarioAvailabilityFiltering(): RecommendationContext {
  const associates: Associate[] = [
    { id: 'assoc-1', name: 'Alice', email: 'alice@example.com', weeklyCapacity: 5, isActive: true, availabilityStatus: 'available' },
    { id: 'assoc-2', name: 'Bob', email: 'bob@example.com', weeklyCapacity: 5, isActive: true, availabilityStatus: 'leave' },
    { id: 'assoc-3', name: 'Charlie', email: 'charlie@example.com', weeklyCapacity: 5, isActive: false, availabilityStatus: 'available' },
    { id: 'assoc-4', name: 'David', email: 'david@example.com', weeklyCapacity: 5, isActive: true, availabilityStatus: 'training' },
  ]

  const workloadData: WorkloadData[] = [
    { associateId: 'assoc-1', activeProjectCount: 2, weeklyAssignedCount: 2, oldestProjectDate: null },
    { associateId: 'assoc-2', activeProjectCount: 1, weeklyAssignedCount: 1, oldestProjectDate: null },
    { associateId: 'assoc-3', activeProjectCount: 0, weeklyAssignedCount: 0, oldestProjectDate: null },
    { associateId: 'assoc-4', activeProjectCount: 1, weeklyAssignedCount: 1, oldestProjectDate: null },
  ]

  return {
    projectDate: new Date('2024-06-15'),
    weekNumber: 24,
    year: 2024,
    availableAssociates: associates,
    workloadData,
  }
}
