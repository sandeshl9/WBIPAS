# WBIPAS Recommendation Engine

## Version 2.0.0 (Volume 4 Compliant)

The recommendation engine is the core intelligence of WBIPAS. It implements a deterministic, fair, and auditable algorithm for assigning projects to associates based on capacity, workload, and FIFO principles.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Principles](#core-principles)
4. [Quick Start](#quick-start)
5. [API Reference](#api-reference)
6. [Algorithm Details](#algorithm-details)
7. [Enterprise Features](#enterprise-features)
8. [Testing](#testing)
9. [Integration Guide](#integration-guide)
10. [Future Roadmap](#future-roadmap)

---

## Overview

### What is the Recommendation Engine?

The recommendation engine is a **pure TypeScript domain module** with zero dependencies on React, Supabase, or any UI framework. It implements the 11-step assignment algorithm specified in Volume 4 of the product requirements.

### Key Features

- ✅ **Deterministic** - Same input always produces same output
- ✅ **Fair** - Balances workload across all associates
- ✅ **Transparent** - Every decision is explained and auditable
- ✅ **Enterprise-Ready** - Supports top N preview, simulation mode, fairness metrics
- ✅ **Strategy Pattern** - Pluggable algorithms (FIFO, Balanced, AI-ready)
- ✅ **Fully Tested** - 50+ unit tests covering all scenarios
- ✅ **Version Tracked** - Every recommendation includes engine version

### Design Philosophy

1. **Zero Dependencies** - Pure TypeScript, no external libraries
2. **Domain-Driven Design** - Business logic isolated from infrastructure
3. **Immutable Data** - No side effects, pure functions
4. **Composable** - Small, focused classes with single responsibilities
5. **Testable** - 100% unit test coverage possible

---

## Architecture

### Module Structure

```
recommendation-engine/
├── AssignmentEngine.ts          # Main orchestrator (11-step algorithm)
├── CapacityEngine.ts            # Weekly capacity filtering
├── WorkloadEngine.ts            # Active workload calculation
├── FIFOEngine.ts                # FIFO tie-breaking
├── AlphabeticalEngine.ts        # Alphabetical tie-breaking
├── RecommendationExplainer.ts   # Explanation generation
├── FairnessCalculator.ts        # Fairness metrics (std dev, Gini, balance score)
├── types.ts                     # Core type definitions
├── index.ts                     # Public API exports
├── strategies/
│   ├── IRecommendationStrategy.ts        # Strategy interface
│   ├── FIFORecommendationStrategy.ts     # Default strategy (implemented)
│   ├── BalancedRecommendationStrategy.ts # Pure balance strategy (implemented)
│   ├── SkillBasedRecommendationStrategy.ts # Skill matching (placeholder)
│   ├── AIRecommendationStrategy.ts       # ML-based (placeholder)
│   ├── StrategyFactory.ts                # Strategy registry
│   └── index.ts
└── __tests__/
    ├── AssignmentEngine.test.ts     # 35+ test scenarios
    ├── FairnessCalculator.test.ts   # 15+ test scenarios
    ├── StrategyFactory.test.ts      # 10+ test scenarios
    └── README.md                     # Test documentation
```

### Data Flow

```
Application Layer (Services)
    ↓
Fetch Data (Repositories)
    ↓
Transform Data (map to engine types)
    ↓
Build RecommendationContext
    ↓
Call AssignmentEngine.getRecommendation()
    ↓
Engine executes 11-step algorithm
    ↓
Return RecommendationResult
    ↓
Application Layer handles result
```

---

## Core Principles

### 1. Weekly Capacity vs Active Workload

**CRITICAL DISTINCTION:**

- **Weekly Capacity Check**: Projects in the **same week only** (eligibility filter)
- **Active Workload**: Projects across **all weeks** (fairness ranking)

```typescript
// Capacity eligibility (same week)
weeklyAssignedCount < weeklyCapacity  // Can this associate take more work THIS week?

// Workload fairness (all weeks)
activeProjectCount = pending + assigned + in_progress + on_hold  // How much total work do they have?
```

**Example:**

```
Alice:
- Weekly capacity: 5
- Week 24 assigned: 3 (eligible ✓)
- Total active projects: 15 (high workload)

Bob:
- Weekly capacity: 5
- Week 24 assigned: 5 (NOT eligible ✗)
- Total active projects: 5 (low workload)

Result: Alice is recommended despite higher overall workload,
because she has capacity in the target week.
```

### 2. Deterministic Rule Order

The evaluation order is **fixed** and **never changes**:

1. Associate Availability
2. Weekly Capacity Eligibility
3. Lowest Active Workload
4. FIFO (Oldest Active Project Date)
5. Alphabetical Order

### 3. Sequential Assignment

Bulk assignments **MUST** recalculate after each assignment:

```typescript
// ✅ CORRECT
for (const project of projects) {
  recommendation = getRecommendation()  // Fresh calculation
  assign(recommendation)
  // Workload updated before next iteration
}

// ❌ WRONG
recommendations = projects.map(p => getRecommendation(p))  // Stale data
assignments = recommendations.map(r => assign(r))
```

### 4. Active Workload Definition

Active workload includes:
- `pending` status
- `assigned` status
- `in_progress` status
- `on_hold` status

**Excludes:**
- `completed` status
- `cancelled` status

Opening balance projects are treated exactly like normal projects.

### 5. FIFO Logic

FIFO uses `MIN(project_date)` from all active projects.

**Never use:**
- Latest project date
- Average project date
- Completion date
- Assignment date

---

## Quick Start

### Basic Usage

```typescript
import { AssignmentEngine } from '@/recommendation-engine'

// Build context
const context = {
  projectDate: new Date('2024-06-15'),
  weekNumber: 24,
  year: 2024,
  availableAssociates: [
    {
      id: '1',
      name: 'Alice',
      email: 'alice@example.com',
      weeklyCapacity: 5,
      isActive: true,
      availabilityStatus: 'available',
    },
    // ... more associates
  ],
  workloadData: [
    {
      associateId: '1',
      activeProjectCount: 3,  // All weeks
      weeklyAssignedCount: 2, // This week only
      oldestProjectDate: new Date('2024-06-01'),
    },
    // ... more workload data
  ],
}

// Get recommendation
const recommendation = AssignmentEngine.getRecommendation(context)

if (recommendation) {
  console.log('Recommended:', recommendation.associate.name)
  console.log('Reason:', recommendation.reason)
  console.log('Explanation:', recommendation.explanationText)
  console.log('Workload before:', recommendation.workloadBefore)
  console.log('Workload after:', recommendation.workloadAfter)
  console.log('Engine version:', recommendation.engineVersion)
}
```

### Top N Candidates

```typescript
// Get top 5 ranked recommendations
const ranked = AssignmentEngine.getTopCandidates(context, 5)

ranked.forEach((candidate) => {
  console.log(`Rank ${candidate.rank}: ${candidate.associate.name}`)
  console.log(`  Score: ${candidate.score}`)
  console.log(`  Reason: ${candidate.reason}`)
})
```

### Bulk Assignment Simulation

```typescript
const projects = [
  { date: new Date('2024-06-15') },
  { date: new Date('2024-06-16') },
  { date: new Date('2024-06-17') },
]

const simulation = AssignmentEngine.simulateDistribution(projects, context)

console.log('Assignments:', simulation.assignments.length)
console.log('Failed:', simulation.failedAssignments)
console.log('Balance Score:', simulation.fairnessMetrics.balanceScore)
console.log('Standard Deviation:', simulation.fairnessMetrics.standardDeviation)
```

---

## API Reference

### AssignmentEngine

#### `getRecommendation(context: RecommendationContext): RecommendationResult | null`

Execute the 11-step recommendation algorithm.

**Returns:** Single best recommendation or `null` if no eligible associate.

#### `getTopCandidates(context: RecommendationContext, limit: number = 5): RankedRecommendation[]`

Get top N ranked recommendations.

**Returns:** Array of ranked recommendations sorted by score.

#### `simulateDistribution(projects: Array<{ date: Date }>, context: RecommendationContext): SimulationResult`

Simulate bulk assignment with fairness metrics.

**Returns:** Complete simulation with assignments, distribution summary, and fairness metrics.

#### `validateContext(context: RecommendationContext): { valid: boolean; errors: string[] }`

Validate recommendation context.

**Returns:** Validation result with error messages if invalid.

#### `getEngineInfo(): { version: string; algorithm: string; steps: string[] }`

Get engine metadata.

**Returns:** Engine version, algorithm name, and list of steps.

### FairnessCalculator

#### `calculateMetrics(workloads: number[]): FairnessMetrics`

Calculate comprehensive fairness metrics.

**Returns:**
- `standardDeviation`: Workload standard deviation
- `balanceScore`: 0-100 score (higher is better)
- `minWorkload`: Minimum workload
- `maxWorkload`: Maximum workload
- `averageWorkload`: Average workload
- `giniCoefficient`: 0-1 coefficient (0 = perfect equality)

#### `calculateBalanceScore(workloads: number[]): number`

Calculate balance score (0-100).

**Score Interpretation:**
- 90-100: Excellent balance
- 80-89: Good balance
- 70-79: Fair balance
- <70: Poor balance

#### `isFairDistribution(metrics: FairnessMetrics, threshold: number = 80): boolean`

Determine if distribution is fair.

**Returns:** `true` if balance score >= threshold.

### StrategyFactory

#### `getStrategy(type: StrategyType): IRecommendationStrategy`

Get strategy by type ('fifo' | 'balanced' | 'skill-based' | 'ai').

#### `getDefaultStrategy(): IRecommendationStrategy`

Get default strategy (FIFO).

#### `getAllStrategies(): Array<{ type, name, description, available }>`

List all registered strategies.

#### `isStrategyAvailable(type: StrategyType): boolean`

Check if strategy is implemented.

---

## Algorithm Details

### 11-Step Algorithm

```
Step 1:  Determine project week number
Step 2:  Filter active & available associates
Step 3:  Check weekly capacity eligibility
Step 4:  Calculate active workload
Step 5:  Select lowest workload
Step 6:  Apply FIFO tie-breaker
Step 7:  Apply alphabetical tie-breaker
Step 8:  Generate explanation
Step 9:  Wait for manager confirmation
Step 10: Assign in database transaction
Step 11: Update audit trail & dashboard
```

**Steps 1-8** are implemented in the engine.  
**Steps 9-11** are handled by the application layer (AssignmentService).

### Filtering Logic

#### Step 2: Availability Filtering

```typescript
// Exclude if:
associate.isActive === false
associate.availabilityStatus !== 'available'  // (leave, training, holiday, inactive)
```

#### Step 3: Capacity Filtering

```typescript
// Include only if:
weeklyAssignedCount < weeklyCapacity

// Where weeklyAssignedCount is projects in the SAME WEEK
```

### Ranking Logic

#### Step 5: Workload Comparison

```typescript
// Find minimum active workload
const minWorkload = Math.min(...associates.map(a => a.activeProjectCount))

// Keep only those with minimum
const candidates = associates.filter(a => a.activeProjectCount === minWorkload)
```

#### Step 6: FIFO Tie-Breaking

```typescript
// Find oldest active project date
const oldestDate = Math.min(...candidates.map(a => a.oldestProjectDate.getTime()))

// Keep only those with oldest date
const fifoWinners = candidates.filter(
  a => a.oldestProjectDate.getTime() === oldestDate
)
```

#### Step 7: Alphabetical Tie-Breaking

```typescript
// Sort by name and pick first
const winner = fifoWinners.sort((a, b) => 
  a.associate.name.localeCompare(b.associate.name)
)[0]
```

---

## Enterprise Features

### 1. Top N Preview

Managers can see the top 5 candidates before committing:

```typescript
const topCandidates = AssignmentEngine.getTopCandidates(context, 5)

// Display to manager:
// Rank 1: Alice - Lowest workload (3 projects)
// Rank 2: Bob - Lowest workload (3 projects), older FIFO date
// Rank 3: Charlie - Higher workload (5 projects)
// ...
```

### 2. Simulation Mode

Preview bulk assignment distribution before executing:

```typescript
const simulation = AssignmentEngine.simulateDistribution(projects, context)

// Show fairness metrics:
console.log(`Balance Score: ${simulation.fairnessMetrics.balanceScore}/100`)
console.log(`Distribution Range: ${simulation.fairnessMetrics.minWorkload} - ${simulation.fairnessMetrics.maxWorkload}`)

// If fairness is acceptable, proceed with actual assignment
if (simulation.fairnessMetrics.balanceScore >= 80) {
  await AssignmentService.bulkAssign(projectIds)
}
```

### 3. Fairness Metrics

Track workload distribution quality:

```typescript
const metrics = FairnessCalculator.calculateMetrics([5, 5, 6, 6, 7])

// Standard deviation: 0.89
// Balance score: 94.3
// Gini coefficient: 0.067
// Assessment: "Excellent balance"
```

### 4. Engine Versioning

Every recommendation includes the engine version:

```typescript
recommendation.engineVersion  // "2.0.0"

// Stored in database for audit trail
// If algorithm changes, historical assignments remain traceable
```

### 5. Strategy Pattern

Switch algorithms at runtime:

```typescript
// Use FIFO strategy (default)
const fifoStrategy = StrategyFactory.getStrategy('fifo')
const recommendation = fifoStrategy.recommend(context)

// Use Balanced strategy (no FIFO, pure balance)
const balancedStrategy = StrategyFactory.getStrategy('balanced')
const recommendation = balancedStrategy.recommend(context)

// Future: AI strategy
// const aiStrategy = StrategyFactory.getStrategy('ai')
```

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Run once (CI mode)
npm run test:run

# Run with coverage
npm run test:coverage
```

### Test Coverage

- **50+ test cases** covering all Volume 4 scenarios
- **3 test suites**: AssignmentEngine, FairnessCalculator, StrategyFactory
- **7 pre-built scenarios** for reusable test data
- **Target coverage**: 90%+

See [__tests__/README.md](./__tests__/README.md) for detailed test documentation.

---

## Integration Guide

### Application Service Integration

```typescript
// src/features/recommendation/services/RecommendationService.ts
import { AssignmentEngine } from '@/recommendation-engine'

export class RecommendationService {
  static async getRecommendation(projectDate: Date) {
    // 1. Fetch data from repositories
    const associates = await AssociateRepository.findActiveAndAvailable()
    const workload = await WorkloadRepository.getWorkloadForWeek(week, year)
    
    // 2. Transform to engine format
    const context = this.buildContext(associates, workload, projectDate)
    
    // 3. Call engine (pure domain logic)
    const recommendation = AssignmentEngine.getRecommendation(context)
    
    // 4. Return result
    return { data: recommendation, error: null }
  }
}
```

### Assignment Transaction Integration

```typescript
// src/features/assignment/services/AssignmentService.ts
export class AssignmentService {
  static async assignProject(input: AssignProjectInput) {
    // 1. Revalidate recommendation
    const revalidation = await this.revalidateRecommendation(
      input.projectId,
      input.associateId
    )
    
    if (!revalidation.valid) {
      return { success: false, error: revalidation.error }
    }
    
    // 2. Call database stored procedure (atomic transaction)
    const { data } = await supabase.rpc('assign_project', {
      p_project_id: input.projectId,
      p_associate_id: input.associateId,
      p_assigned_by: user.id,
      p_engine_version: ENGINE_VERSION,
    })
    
    return { success: true, data }
  }
}
```

---

## Future Roadmap

### Version 2.1 (Q3 2024)
- [ ] Skill-based matching strategy
- [ ] Associate skill profiles
- [ ] Project skill requirements
- [ ] Enhanced FIFO with skill weighting

### Version 2.2 (Q4 2024)
- [ ] AI-powered recommendations
- [ ] Historical performance analysis
- [ ] Predictive completion time
- [ ] Learning from manager overrides

### Version 3.0 (Q1 2025)
- [ ] Multi-tenant support
- [ ] Custom business rules engine
- [ ] Real-time capacity updates
- [ ] Advanced fairness algorithms

---

## Support & Contributing

### Documentation

- **Volume 1**: [Product Requirements Document](../../docs/VOLUME_1_PRD.md)
- **Volume 2**: [Technical Architecture Document](../../DDD_ARCHITECTURE.md)
- **Volume 3**: [Database Design](../../supabase/DATABASE_SCHEMA.md)
- **Volume 4**: [Assignment Engine Specification](../../docs/VOLUME_4_AES.md)
- **Gap Analysis**: [VOLUME_4_GAP_ANALYSIS.md](./VOLUME_4_GAP_ANALYSIS.md)

### Questions?

For questions about the recommendation engine:
- Review the test suite in `__tests__/` for usage examples
- Check the gap analysis document for implementation details
- Review Volume 4 specification for business rules

---

## License

Proprietary - WBIPAS Project

---

**Version 2.0.0** | Last Updated: June 28, 2024 | Volume 4 Compliant ✅
