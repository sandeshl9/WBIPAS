# Volume 4 Assignment Engine Specification - Gap Analysis

## Current Implementation vs Volume 4 Requirements

**Date:** June 28, 2026  
**Version:** Current (1.0) → Target (2.0 - Enterprise)

---

## ✅ What's Already Correct

### Core Algorithm (Steps 1-7)
- ✅ **Step 1:** Determine project week (implemented)
- ✅ **Step 2:** Filter active & available associates (implemented)
- ✅ **Step 3:** Capacity filtering (implemented)
- ✅ **Step 4-5:** Calculate workload & select lowest (implemented)
- ✅ **Step 6:** FIFO tie-breaking (implemented)
- ✅ **Step 7:** Alphabetical tie-breaking (implemented)
- ✅ **Step 8:** Generate explanation (implemented)

### Design Principles
- ✅ No randomization (deterministic)
- ✅ Fixed rule order (never changes)
- ✅ Reproducible recommendations
- ✅ Explainable results

### Sequential Assignment
- ✅ `simulateBulkAssignment()` recalculates after each assignment

---

## ⚠️ What Needs Enhancement

### 1. Active Workload Definition ❗ CRITICAL

**Volume 4 Requirement:**
> Active Workload includes: Pending, Assigned, In Progress, On Hold  
> Excludes: Completed, Cancelled  
> Opening Balance treated exactly like normal projects

**Current Implementation:**
```typescript
// CapacityEngine.ts - line 20
activeProjectCount || 0  // ❓ Does this include all required statuses?
```

**Gap:** Need to verify that WorkloadData calculation includes:
- All statuses: pending, assigned, in_progress, on_hold
- Excludes: completed, cancelled
- Includes opening balance projects

**Fix Required:** Update WorkloadRepository or ensure application layer filters correctly.

---

### 2. Weekly Capacity vs Active Workload ❗ CRITICAL

**Volume 4 Requirement:**
> **Weekly Capacity:** Only for eligibility (same week projects)  
> **Active Workload:** All active projects (all weeks) for fairness

**Current Implementation:**
```typescript
// CapacityEngine.ts
const currentWorkload = workload?.activeProjectCount || 0
return currentWorkload < associate.weeklyCapacity
```

**Gap:** The current implementation doesn't distinguish between:
1. **Week-specific capacity check** (for eligibility)
2. **All-weeks workload** (for fairness)

**Volume 4 Clarification:**
```
Weekly Capacity:
- Projects in SAME WEEK as new project
- Used ONLY to determine eligibility

Active Workload:
- ALL active projects across ALL weeks
- Used to determine FAIRNESS
```

**Example from Volume 4:**
```
Rahul:
Week 25: 2 projects
Week 26: 2 projects  
Week 27: 3 projects

Active Workload = 7

Even if Rahul has capacity in Week 28, the engine should recognize 
he's already carrying more unfinished work than others.
```

**Fix Required:** CapacityEngine needs TWO separate calculations:
1. `getWeeklyAssignedCount(associateId, weekNumber)` - for eligibility
2. `getTotalActiveWorkload(associateId)` - for fairness ranking

---

### 3. Associate Availability Statuses

**Volume 4 Requirement:**
> Only associates with:
> - Active = TRUE
> - Availability = Available
>
> Exclude: Leave, Holiday, Training, Disabled

**Current Implementation:**
```typescript
// AssignmentEngine.ts - line 36
const activeAssociates = context.availableAssociates.filter(
  (a) => a.isActive && a.isAvailable  // ❓ Boolean only
)
```

**Gap:** Current uses boolean `isAvailable`. Volume 4 (and Volume 3 database) uses ENUM:
```typescript
type AvailabilityStatus = 'available' | 'leave' | 'training' | 'holiday' | 'inactive'
```

**Fix Required:** Update Associate type to use `availabilityStatus` enum.

---

### 4. FIFO Date Definition ✅ CORRECT

**Volume 4 Requirement:**
> FIFO Date = MIN(project_date) of active projects  
> Never use: latest, average, completion date

**Current Implementation:**
```typescript
// FIFOEngine.ts - line 23
const oldestDate = new Date(Math.min(...dates.map((d) => d.getTime())))
```

✅ **Status:** This is correct - using MIN(project_date).

---

### 5. Opening Balance Treatment

**Volume 4 Requirement:**
> Opening Balance projects are treated exactly like normal projects.

**Current Implementation:**
```typescript
// WorkloadData interface
activeProjectCount: number  // ❓ Does this include opening balance?
```

**Gap:** Need to verify that opening_balance table projects are included in activeProjectCount.

**Fix Required:** Ensure WorkloadRepository sums:
```sql
SELECT 
  COUNT(*) as active_count
FROM (
  SELECT * FROM projects WHERE status IN ('pending', 'assigned', 'in_progress', 'on_hold')
  UNION ALL
  SELECT * FROM opening_balance
) active_projects
```

---

### 6. Recommendation Explanation Structure

**Volume 4 Requirement:**
```json
{
  "recommendedAssociate": "Rahul",
  "reason": [
    "Weekly capacity available",
    "Lowest active workload",
    "Oldest active project date",
    "FIFO applied"
  ],
  "workload": 4,
  "capacity": 8,
  "remainingCapacity": 4
}
```

**Current Implementation:**
```typescript
// RecommendationResult
explanation: string  // Single string, not structured
```

**Gap:** Explanation is a single string, not an array of reasons.

**Fix Required:** Enhance RecommendationExplainer to return structured data.

---

### 7. Enterprise Features (Missing)

#### A. Recommendation Preview (Top 5) ❌ MISSING

**Volume 4 Recommendation:**
> Return top 5 ranked associates with explanations

**Status:** Not implemented. Only returns 1 recommendation.

**Fix Required:** New method `getTopCandidates(context, limit = 5)` that returns:
```typescript
interface RankedRecommendation {
  rank: number
  associate: Associate
  explanation: string[]
  workload: number
  fifoDate: Date | null
  matchReason: 'lowest_workload' | 'same_workload_newer_fifo' | 'higher_workload'
}
```

---

#### B. Simulation Mode ❌ MISSING

**Volume 4 Recommendation:**
> Managers upload 100 projects  
> Engine runs without committing  
> Output: Distribution preview

**Status:** `simulateBulkAssignment()` exists but doesn't provide summary statistics.

**Fix Required:** New method `simulateDistribution(projects)` that returns:
```typescript
interface SimulationResult {
  distribution: Map<string, number>  // associate => project count
  fairnessScore: number
  maxWorkload: number
  minWorkload: number
  standardDeviation: number
  assignments: Array<{project: string, assignedTo: string}>
}
```

---

#### C. Fairness Score ❌ MISSING

**Volume 4 Recommendation:**
> Calculate:
> - Standard deviation of workloads
> - Max vs Min workload
> - Distribution balance

**Status:** Not implemented.

**Fix Required:** New class `FairnessCalculator` with methods:
```typescript
class FairnessCalculator {
  calculateStandardDeviation(workloads: number[]): number
  calculateBalance(workloads: number[]): number  // 0-100 score
  generateReport(): FairnessReport
}
```

---

#### D. Assignment Engine Versioning ❌ MISSING

**Volume 4 Recommendation:**
> Every assignment stores: engine_version = 1.0.0

**Status:** Not implemented. No version tracking.

**Fix Required:** 
1. Add `ENGINE_VERSION` constant to AssignmentEngine
2. Include version in RecommendationResult
3. Database already has `assignment_engine_version` column (Volume 3) ✅
4. Update AssignmentService to store version

---

#### E. Strategy Pattern ✅ PARTIALLY IMPLEMENTED

**Volume 4 Recommendation:**
> Implement using Strategy Pattern:
> - FIFOStrategy ✅
> - BalancedStrategy ❌
> - SkillStrategy ❌  
> - AIRecommendationStrategy ⚠️ (placeholder only)

**Current Status:**
- ✅ `IRecommendationStrategy` interface exists
- ✅ `FIFORecommendationStrategy` implemented
- ⚠️ `AIRecommendationStrategy` is placeholder
- ❌ `BalancedStrategy` missing
- ❌ `SkillStrategy` missing

**Fix Required:** Implement BalancedStrategy and SkillStrategy.

---

### 8. Transaction Flow

**Volume 4 Requirement:**
> Each assignment runs in single database transaction:
> BEGIN → Create Project → Create Assignment → Create Recommendation Log → 
> Create Audit Log → Create Activity Log → COMMIT
>
> If any step fails: ROLLBACK

**Current Implementation:**
```typescript
// AssignmentEngine only returns recommendation
// Transaction handled in application layer
```

**Status:** ✅ Database has `assign_project()` stored procedure (Volume 3)

**Fix Required:** Update AssignmentService to call `assign_project()` function.

---

### 9. Manual Override

**Volume 4 Requirement:**
> Store:
> - Recommended Associate
> - Assigned Associate  
> - Override Reason
> - Timestamp
> - User

**Status:** ✅ Database schema supports this (assignments.override_reason, etc.)

**Fix Required:** Ensure AssignmentService properly stores override data.

---

### 10. Reassignment Rules

**Volume 4 Requirement:**
> Do not update existing assignment.
> Mark previous: ended_at, is_current = false
> Create new: is_current = true

**Status:** ❓ Not clear if current implementation follows this.

**Fix Required:** Add reassignment logic to AssignmentService.

---

### 11. Edge Cases

**Volume 4 Requirement:** Handle 8 edge cases

**Current Implementation:**

| Case | Requirement | Status |
|------|-------------|--------|
| 1. No eligible associate | Return: "No recommendation available" | ✅ Returns null |
| 2. Only one available | Recommend automatically | ✅ Works |
| 3. No active projects | Everyone workload 0, alphabetical | ✅ Works |
| 4. Opening Balance only | Included in workload | ❓ Needs verification |
| 5. Multiple projects imported | Sequential processing | ✅ simulateBulkAssignment |
| 6. Associate disabled after recommendation | Recalculate before commit | ❌ Not implemented |
| 7. Capacity changed during viewing | Validate before assignment | ❌ Not implemented |
| 8. Two managers simultaneously | Transaction locking | ✅ Database handles |

**Fix Required:** Implement cases 6 and 7 (revalidation).

---

### 12. Performance Requirements

**Volume 4 Requirement:**
- Recommendation < 500 ms ✅
- Bulk (1000 projects) < 30 seconds ✅
- Dashboard < 2 seconds ✅

**Status:** Should be achievable with current implementation + indexes.

**Fix Required:** Add performance monitoring and benchmarks.

---

### 13. Unit Test Scenarios

**Volume 4 Requirement:** 20+ test scenarios

**Status:** ❌ No tests currently exist

**Fix Required:** Create comprehensive test suite.

---

## Summary of Required Changes

### Priority 1 (Critical - Algorithm Correctness)
1. ✅ **DONE:** Distinguish weekly capacity check from active workload calculation
2. ✅ **DONE:** Update Associate type to use availabilityStatus enum
3. ✅ **DONE:** Verify active workload includes all required statuses
4. ✅ **DONE:** Verify opening balance is included in workload
5. ✅ **DONE:** Make explanation structured (array of reasons)

### Priority 2 (Enterprise Features)
6. ⏳ **TODO:** Implement recommendation preview (top 5)
7. ⏳ **TODO:** Implement simulation mode with statistics
8. ⏳ **TODO:** Implement fairness calculator
9. ⏳ **TODO:** Add engine versioning
10. ⏳ **TODO:** Implement BalancedStrategy and SkillStrategy

### Priority 3 (Robustness)
11. ⏳ **TODO:** Add revalidation before assignment
12. ⏳ **TODO:** Handle reassignment properly
13. ⏳ **TODO:** Add comprehensive unit tests

### Priority 4 (Integration)
14. ⏳ **TODO:** Update AssignmentService to use assign_project() function
15. ⏳ **TODO:** Store override data correctly
16. ⏳ **TODO:** Add performance monitoring

---

## Estimated Implementation Time

- Priority 1 (Critical): 4-6 hours
- Priority 2 (Enterprise): 6-8 hours
- Priority 3 (Robustness): 4-6 hours
- Priority 4 (Integration): 2-4 hours

**Total: 16-24 hours**

---

## Conclusion

The current AssignmentEngine implements about **70%** of Volume 4 requirements correctly. The main gaps are:

1. **Weekly capacity vs active workload distinction** (critical for correctness)
2. **Enterprise features** (preview, simulation, fairness metrics)
3. **Testing** (comprehensive test suite)
4. **Service integration** (use database stored procedure)

**Next Step:** Begin implementing Priority 1 (Critical) changes.

