# Recommendation Engine Test Suite

## Overview

This directory contains comprehensive unit tests for the WBIPAS recommendation engine, covering all 20+ scenarios specified in Volume 4 of the Assignment Engine Specification.

## Test Structure

```
__tests__/
├── AssignmentEngine.test.ts      # Main algorithm tests (20+ scenarios)
├── FairnessCalculator.test.ts    # Fairness metrics tests
├── StrategyFactory.test.ts       # Strategy pattern tests
└── README.md                      # This file
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test

# Run tests with UI
npm run test:ui

# Run tests once (CI mode)
npm run test:run

# Run tests with coverage
npm run test:coverage
```

## Test Coverage

### AssignmentEngine Tests (20+ Scenarios)

#### Basic Recommendation Flow
1. ✅ No associates available
2. ✅ All associates at capacity
3. ✅ Single available associate
4. ✅ Associate with lowest workload

#### Capacity Filtering
5. ✅ Exclude associates at weekly capacity
6. ✅ Distinguish weekly capacity from active workload
7. ✅ Multiple associates with varying capacity

#### Availability Filtering
8. ✅ Exclude associates on leave
9. ✅ Exclude inactive associates
10. ✅ Multiple availability statuses

#### FIFO Tie-Breaking
11. ✅ Apply FIFO when workloads are equal
12. ✅ Use MIN(project_date) for FIFO
13. ✅ Handle null FIFO dates
14. ✅ FIFO with multiple tied associates

#### Alphabetical Tie-Breaking
15. ✅ Apply alphabetical when workload and FIFO equal
16. ✅ Apply alphabetical with identical FIFO dates
17. ✅ Alphabetical as final deterministic tie-breaker

#### Explanation Generation
18. ✅ Generate structured explanation
19. ✅ Include text explanation
20. ✅ Explanation contains all required metadata

#### Top Candidates Preview
21. ✅ Return top 5 ranked candidates
22. ✅ Empty array when no eligible candidates
23. ✅ Rank by workload, FIFO, then alphabetical

#### Bulk Assignment Simulation
24. ✅ Simulate sequential assignment
25. ✅ Recalculate after each assignment
26. ✅ Calculate fairness metrics

#### Context Validation
27. ✅ Validate required fields
28. ✅ Reject invalid week number
29. ✅ Reject invalid year
30. ✅ Reject empty associates list

#### Engine Metadata
31. ✅ Include engine version in results
32. ✅ Provide engine info

#### Edge Cases
33. ✅ Single associate scenario
34. ✅ Zero workload across all associates
35. ✅ Maximum workload scenario

### FairnessCalculator Tests

- ✅ Calculate metrics for equal workloads
- ✅ Handle empty workload array
- ✅ Calculate metrics for unbalanced distribution
- ✅ Standard deviation calculation
- ✅ Balance score calculation
- ✅ Gini coefficient calculation
- ✅ Fair distribution determination
- ✅ Fairness assessment
- ✅ Compare fairness between distributions

### StrategyFactory Tests

- ✅ Get FIFO strategy
- ✅ Get Balanced strategy
- ✅ Handle unknown strategy
- ✅ Get default strategy
- ✅ List all strategies
- ✅ Check strategy availability
- ✅ Get strategy metadata
- ✅ Validate context handling
- ✅ FIFO strategy behavior
- ✅ Balanced strategy behavior

## Test Fixtures

Reusable test data is provided in `/src/test/fixtures.ts`:

- `createTestAssociate()` - Create single associate
- `createTestAssociates()` - Create multiple associates
- `createTestWorkloadData()` - Create workload data
- `createTestContext()` - Create recommendation context
- `createAssociatesWithWorkload()` - Create associates with specific workloads

### Pre-built Scenarios

- `scenarioEqualWorkload()` - All associates have equal workload
- `scenarioDifferentWorkloads()` - Associates with varying workloads
- `scenarioFIFOTieBreaker()` - FIFO tie-breaker needed
- `scenarioCapacityLimit()` - Some associates at capacity
- `scenarioNoAvailableAssociates()` - No associates available
- `scenarioAllAtCapacity()` - All associates at capacity
- `scenarioAvailabilityFiltering()` - Mixed availability statuses

## Volume 4 Compliance

All tests are designed to verify compliance with Volume 4 Assignment Engine Specification:

### Critical Requirements Tested

1. **Weekly Capacity vs Active Workload**
   - Weekly capacity: Same week only (eligibility)
   - Active workload: All weeks (fairness ranking)

2. **Active Statuses**
   - Pending, Assigned, In Progress, On Hold
   - Excludes: Completed, Cancelled

3. **FIFO Logic**
   - Uses MIN(project_date)
   - Never uses latest/average/completion date

4. **Deterministic Rules**
   - Same input → Same output
   - Fixed evaluation order
   - No randomization

5. **Sequential Assignment**
   - Recalculate after each assignment
   - Never batch recommendations

## Test Quality Metrics

- **Total Test Cases**: 50+
- **Code Coverage Target**: 90%+
- **Test Execution Time**: < 5 seconds
- **Deterministic**: All tests produce consistent results

## Adding New Tests

When adding new test scenarios:

1. Create test fixtures in `/src/test/fixtures.ts`
2. Add test cases to appropriate test file
3. Follow naming convention: `it('should [expected behavior]', ...)`
4. Include assertions for:
   - Expected result
   - Engine version
   - Explanation structure
   - Edge cases

## Continuous Integration

Tests are designed to run in CI/CD pipelines:

- No external dependencies (mocked)
- Fast execution
- Deterministic results
- Clear error messages

## References

- **Volume 4**: Assignment Engine Specification (AES)
- **Gap Analysis**: `/src/recommendation-engine/VOLUME_4_GAP_ANALYSIS.md`
- **Engine Documentation**: `/src/recommendation-engine/README.md` (to be created)
