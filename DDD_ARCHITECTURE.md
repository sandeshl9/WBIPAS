# WBIPAS - Domain-Driven Design Architecture

## Overview

WBIPAS now follows **Domain-Driven Design (DDD)** principles with clear separation between layers. The recommendation engine is the core domain, and all other layers exist to support it.

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                  PRESENTATION LAYER                      │
│  React Components, Forms, Tables, Charts               │
│  • No business logic                                    │
│  • Only displays data and captures user input          │
└─────────────────────────────────────────────────────────┘
                          ↓ ↑
┌─────────────────────────────────────────────────────────┐
│                  APPLICATION LAYER                       │
│  Services (AssociateService, ProjectService, etc.)      │
│  • Orchestration                                        │
│  • Validation                                           │
│  • Error handling                                       │
│  • Audit logging                                        │
│  • NO business calculations                             │
└─────────────────────────────────────────────────────────┘
                          ↓ ↑
┌─────────────────────────────────────────────────────────┐
│                    DOMAIN LAYER                          │
│  Pure Business Logic (Zero Dependencies)                │
│  • CapacityCalculator                                   │
│  • WorkloadCalculator                                   │
│  • UtilizationCalculator                                │
│  • AssignmentEngine (Recommendation Engine)             │
└─────────────────────────────────────────────────────────┘
                          ↓ ↑
┌─────────────────────────────────────────────────────────┐
│                   REPOSITORY LAYER                       │
│  Data Access (Pure CRUD, Zero Business Logic)           │
│  • AssociateRepository                                  │
│  • ProjectRepository                                    │
│  • WorkloadRepository                                   │
└─────────────────────────────────────────────────────────┘
                          ↓ ↑
┌─────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE                         │
│  Supabase, PostgreSQL, External Services                │
└─────────────────────────────────────────────────────────┘
```

---

## Core Principle

**The UI never calculates anything.**

All calculations are done in the **Domain Layer**:
- Workload calculations → `WorkloadCalculator`
- Capacity calculations → `CapacityCalculator`
- Utilization calculations → `UtilizationCalculator`
- Recommendations → `AssignmentEngine`

---

## Folder Structure

```
src/
├── recommendation-engine/          # ISOLATED DOMAIN ENGINE
│   ├── AssignmentEngine.ts         # Main orchestrator
│   ├── CapacityEngine.ts           # Capacity filtering
│   ├── WorkloadEngine.ts           # Workload calculations
│   ├── FIFOEngine.ts               # FIFO tie-breaking
│   ├── AlphabeticalEngine.ts       # Alphabetical tie-breaking
│   ├── RecommendationExplainer.ts  # Human-readable explanations
│   ├── StrategySelector.ts         # Strategy pattern selector
│   ├── strategies/
│   │   ├── IRecommendationStrategy.ts
│   │   ├── FIFORecommendationStrategy.ts
│   │   └── AIRecommendationStrategy.ts (placeholder)
│   └── types.ts
│
├── domain/                         # DOMAIN CALCULATORS
│   ├── CapacityCalculator.ts       # Pure capacity logic
│   ├── WorkloadCalculator.ts       # Pure workload logic
│   └── UtilizationCalculator.ts    # Pure utilization logic
│
├── repositories/                   # DATA ACCESS LAYER
│   ├── AssociateRepository.ts      # CRUD only
│   ├── ProjectRepository.ts        # CRUD only
│   └── WorkloadRepository.ts       # CRUD only
│
├── features/                       # FEATURE-BASED MODULES
│   ├── associates/
│   │   ├── components/             # UI components
│   │   │   ├── AssociatesPage.tsx
│   │   │   └── index.ts
│   │   ├── services/               # Application services
│   │   │   └── AssociateService.ts
│   │   ├── validators/             # Zod schemas
│   │   │   └── associateSchema.ts
│   │   └── hooks/                  # React Query hooks
│   │       ├── useAssociates.ts
│   │       ├── useCreateAssociate.ts
│   │       ├── useUpdateAssociate.ts
│   │       ├── useDeleteAssociate.ts
│   │       ├── useToggleAvailability.ts
│   │       ├── useSearchAssociates.ts
│   │       └── index.ts
│   │
│   ├── projects/
│   │   ├── components/
│   │   │   ├── ProjectsPage.tsx
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   └── ProjectService.ts
│   │   ├── validators/
│   │   │   └── projectSchema.ts
│   │   └── hooks/
│   │       ├── useProjects.ts
│   │       ├── useCreateProject.ts
│   │       ├── useUpdateProjectStatus.ts
│   │       ├── useProjectsByAssociate.ts
│   │       ├── useSearchProjects.ts
│   │       ├── useProjectStatistics.ts
│   │       └── index.ts
│   │
│   ├── recommendation/
│   │   ├── components/
│   │   ├── services/
│   │   │   └── RecommendationService.ts
│   │   └── hooks/
│   │       ├── useRecommendation.ts
│   │       ├── useBulkAssignmentSimulation.ts
│   │       └── index.ts
│   │
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── DashboardPage.tsx
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   └── DashboardService.ts
│   │   └── hooks/
│   │       ├── useDashboardStats.ts
│   │       ├── useAssociateUtilization.ts
│   │       ├── useRecentActivity.ts
│   │       ├── useCapacityHeatmap.ts
│   │       └── index.ts
│   │
│   ├── reports/
│   │   ├── components/
│   │   │   ├── ReportsPage.tsx
│   │   │   └── index.ts
│   │   └── services/
│   │
│   ├── settings/
│   │   ├── components/
│   │   │   ├── SettingsPage.tsx
│   │   │   └── index.ts
│   │   └── validators/
│   │       └── settingsSchema.ts
│   │
│   └── auth/
│       ├── components/
│       │   ├── LoginPage.tsx
│       │   └── index.ts
│       └── services/
│
├── components/                     # SHARED UI COMPONENTS
│   ├── ui/                         # shadcn/ui components
│   ├── layout/                     # Layout components
│   └── ErrorBoundary.tsx
│
├── lib/                            # UTILITIES
│   ├── supabase.ts
│   ├── utils.ts
│   └── toast.tsx
│
└── types/                          # SHARED TYPES
    ├── index.ts
    └── database.ts
```

---

## Layer Responsibilities

### 1. Presentation Layer (React Components)

**Responsibility**: Display data and capture user input

**Rules**:
- ❌ NO calculations
- ❌ NO business logic
- ❌ NO direct database calls
- ✅ Call hooks
- ✅ Display data
- ✅ Handle user interactions

**Example**:
```tsx
function AssociateList() {
  const { data: associates } = useAssociates()
  
  return (
    <Table>
      {associates?.map(associate => (
        <TableRow key={associate.id}>
          <TableCell>{associate.name}</TableCell>
          <TableCell>{associate.current_workload}</TableCell>
          <TableCell>{associate.utilization_percentage}%</TableCell>
        </TableRow>
      ))}
    </Table>
  )
}
```

---

### 2. Application Layer (Services)

**Responsibility**: Orchestrate operations

**Rules**:
- ✅ Fetch data from repositories
- ✅ Call domain layer for calculations
- ✅ Handle errors
- ✅ Log audit trail
- ✅ Validate input (Zod schemas)
- ❌ NO business calculations
- ❌ NO direct SQL

**Example**:
```typescript
export class AssociateService {
  static async getAssociatesWithWorkload() {
    // 1. Fetch from repository
    const { data: associates } = await AssociateRepository.findAll()
    const { data: workloadData } = await WorkloadRepository.getCurrentWorkload()
    
    // 2. Use domain calculators
    const result = associates.map(associate => {
      const workload = workloadData.find(w => w.associateId === associate.id)
      const currentWorkload = workload?.activeProjectCount || 0
      
      // Domain calculator does the math
      const availableCapacity = WorkloadCalculator.calculateAvailableCapacity(
        associate.weekly_capacity,
        currentWorkload
      )
      
      return { ...associate, current_workload: currentWorkload, available_capacity: availableCapacity }
    })
    
    return { data: result, error: null }
  }
}
```

---

### 3. Domain Layer (Business Logic)

**Responsibility**: Pure business logic and calculations

**Rules**:
- ✅ Pure functions
- ✅ Zero external dependencies
- ✅ Can be tested in isolation
- ✅ No React, no Supabase, no UI
- ❌ NO database calls
- ❌ NO UI concerns

**Example**:
```typescript
export class WorkloadCalculator {
  static calculateAvailableCapacity(
    weeklyCapacity: number,
    currentWorkload: number
  ): number {
    return Math.max(0, weeklyCapacity - currentWorkload)
  }
  
  static hasCapacity(weeklyCapacity: number, currentWorkload: number): boolean {
    return currentWorkload < weeklyCapacity
  }
}
```

---

### 4. Repository Layer (Data Access)

**Responsibility**: CRUD operations only

**Rules**:
- ✅ Create, Read, Update, Delete
- ✅ Query building
- ✅ Raw data fetching
- ❌ NO calculations
- ❌ NO business logic
- ❌ NO transformations (except basic mapping)

**Example**:
```typescript
export class AssociateRepository {
  static async findAll() {
    const { data, error } = await supabase
      .from('associates')
      .select('*')
      .order('name', { ascending: true })
    
    return { data, error }
  }
  
  static async findById(id: string) {
    const { data, error } = await supabase
      .from('associates')
      .select('*')
      .eq('id', id)
      .single()
    
    return { data, error }
  }
}
```

---

## Recommendation Engine (Core Domain)

The recommendation engine is **completely isolated**:

```
recommendation-engine/
├── AssignmentEngine.ts         ← Main entry point
├── CapacityEngine.ts           ← Step 3: Capacity filtering
├── WorkloadEngine.ts           ← Step 4-5: Workload calculations
├── FIFOEngine.ts               ← Step 6: FIFO tie-breaking
├── AlphabeticalEngine.ts       ← Step 7: Alphabetical sorting
├── RecommendationExplainer.ts  ← Step 8: Generate explanations
└── strategies/
    ├── IRecommendationStrategy.ts
    ├── FIFORecommendationStrategy.ts
    └── AIRecommendationStrategy.ts
```

**Usage**:
```typescript
import { AssignmentEngine } from '@/recommendation-engine'

const result = AssignmentEngine.getRecommendation(context)
```

**Why isolated?**
- Can be tested independently
- Can be swapped for AI in the future
- Can be used by CLI tools, APIs, etc.
- Zero coupling to React or UI

---

## Strategy Pattern for Recommendations

Future-ready architecture allows switching recommendation strategies:

```typescript
// Current: FIFO Strategy
const strategy = new FIFORecommendationStrategy()
const result = strategy.recommend(context)

// Future: AI Strategy
const strategy = new AIRecommendationStrategy()
const result = strategy.recommend(context)
```

**Implementation**:
```typescript
export interface IRecommendationStrategy {
  recommend(context: RecommendationContext): RecommendationResult | null
  getName(): string
  getDescription(): string
  canHandle(context: RecommendationContext): boolean
}
```

---

## Data Flow Example: Assign Project

```
1. User clicks "Assign Project" in UI (Component)
   ↓
2. Component calls useRecommendation() hook
   const { data: recommendation } = useRecommendation({ projectDate })
   ↓
3. React Query executes queryFn:
   - Checks cache first (if fresh, return cached data)
   - If stale or missing, calls RecommendationService.getRecommendation()
   ↓
4. RecommendationService fetches data from repositories:
   - AssociateRepository.findActiveAndAvailable()
   - WorkloadRepository.getWorkloadForWeek()
   ↓
5. Service calls domain engine:
   - AssignmentEngine.getRecommendation(context)
   ↓
6. Engine executes 11-step algorithm:
   - CapacityEngine.filterByCapacity()
   - WorkloadEngine.selectLowestWorkload()
   - FIFOEngine.applyFIFO()
   - AlphabeticalEngine.applyAlphabetical()
   - RecommendationExplainer.generateExplanation()
   ↓
7. Service returns result to React Query
   ↓
8. React Query caches result and returns to hook
   ↓
9. Component displays recommendation to user
   ↓
10. User confirms assignment → calls useAssignProject() mutation
    ↓
11. Mutation executes:
    - ProjectService.assignProject(projectId, associateId)
    - Transaction: Update project + Create assignment record
    ↓
12. onSuccess callback:
    - queryClient.invalidateQueries(['projects'])
    - queryClient.invalidateQueries(['associates'])
    - queryClient.invalidateQueries(['dashboard'])
    - toast.success('Project assigned successfully')
    ↓
13. React Query refetches invalidated queries automatically
    ↓
14. UI updates with fresh data
    ↓
15. Audit log created in background
```

**Key React Query Benefits**:
- ✅ Automatic caching (no duplicate fetches)
- ✅ Background refetching (data stays fresh)
- ✅ Optimistic updates (instant UI feedback)
- ✅ Loading/error states (better UX)
- ✅ Request deduplication (performance)
- ✅ Garbage collection (memory management)
```

---

## Validation Strategy

All forms use **React Hook Form + Zod**:

```typescript
// 1. Define schema
const createAssociateSchema = z.object({
  employeeId: z.string().min(1).max(50),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  weeklyCapacity: z.number().int().min(1).max(100),
})

// 2. Use in form
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(createAssociateSchema)
})

// 3. Submit
const onSubmit = async (data) => {
  const { error } = await AssociateService.createAssociate(data)
  if (error) {
    toastError(error)
  } else {
    toastSuccess('Associate created successfully')
  }
}
```

---

## Error Handling

Three levels of error handling:

### 1. Component Level (UI Feedback)
```typescript
try {
  await service.doSomething()
  toastSuccess('Success!')
} catch (error) {
  toastError(error.message)
}
```

### 2. Service Level (Logging)
```typescript
try {
  // Operation
} catch (error) {
  console.error('Service error:', error)
  return { data: null, error: error.message }
}
```

### 3. Error Boundary (Crash Prevention)
```tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

---

## Testing Strategy

### Domain Layer Tests (Pure Functions)
```typescript
describe('WorkloadCalculator', () => {
  it('should calculate available capacity correctly', () => {
    expect(WorkloadCalculator.calculateAvailableCapacity(5, 3)).toBe(2)
  })
  
  it('should never return negative capacity', () => {
    expect(WorkloadCalculator.calculateAvailableCapacity(5, 10)).toBe(0)
  })
})
```

### Recommendation Engine Tests
```typescript
describe('AssignmentEngine', () => {
  it('should recommend associate with lowest workload', () => {
    const result = AssignmentEngine.getRecommendation(context)
    expect(result.associate.id).toBe('associate-with-lowest-workload')
  })
  
  it('should apply FIFO when workloads are equal', () => {
    // Test FIFO logic
  })
})
```

### Service Layer Tests (Mocked Repositories)
```typescript
describe('AssociateService', () => {
  it('should fetch associates with calculated workload', async () => {
    // Mock repositories
    jest.spyOn(AssociateRepository, 'findAll').mockResolvedValue({ data: mockAssociates })
    jest.spyOn(WorkloadRepository, 'getCurrentWorkload').mockResolvedValue({ data: mockWorkload })
    
    const result = await AssociateService.getAssociatesWithWorkload()
    expect(result.data[0].current_workload).toBe(3)
  })
})
```

---

## Performance Considerations

### React Query Caching Strategy

Different data types have different staleness requirements:

```typescript
// Dashboard stats: 2 minutes (frequently changing)
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: fetchDashboardStats,
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5, // Auto-refresh every 5 minutes
  })
}

// Associates list: 5 minutes (changes less frequently)
export const useAssociates = () => {
  return useQuery({
    queryKey: ['associates'],
    queryFn: fetchAssociates,
    staleTime: 1000 * 60 * 5,
  })
}

// Recommendations: 30 seconds (time-sensitive)
export const useRecommendation = ({ projectDate }) => {
  return useQuery({
    queryKey: ['recommendation', projectDate],
    queryFn: () => fetchRecommendation(projectDate),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
  })
}

// Search results: No cache (always fresh)
export const useSearchProjects = (query: string) => {
  return useQuery({
    queryKey: ['projects', 'search', query],
    queryFn: () => searchProjects(query),
    enabled: query.length > 0,
    staleTime: 0,
  })
}
```

### Query Key Structure

Consistent query key patterns for easy invalidation:

```typescript
// Feature-based keys
['associates']                           // All associates
['associates', id]                       // Specific associate
['associates', 'search', query]          // Search results

['projects']                             // All projects
['projects', { status: ['active'] }]     // Filtered projects
['projects', 'by-associate', id]         // Associate's projects

['dashboard', 'stats']                   // Dashboard stats
['dashboard', 'utilization']             // Utilization data
['dashboard', 'heatmap']                 // Capacity heatmap

['recommendation', date]                 // Recommendation for date
```

### Invalidation Patterns

```typescript
// Invalidate all associates queries
queryClient.invalidateQueries({ queryKey: ['associates'] })

// Invalidate specific associate
queryClient.invalidateQueries({ queryKey: ['associates', id] })

// Invalidate multiple related queries
const onProjectCreated = () => {
  queryClient.invalidateQueries({ queryKey: ['projects'] })
  queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  queryClient.invalidateQueries({ queryKey: ['project-statistics'] })
}
```

### Parallel Data Fetching

React Query automatically parallelizes independent queries:

```typescript
function DashboardPage() {
  // All three queries run in parallel
  const { data: stats } = useDashboardStats()
  const { data: utilization } = useAssociateUtilization()
  const { data: activity } = useRecentActivity()
  
  // Render when all data is ready
  return <Dashboard stats={stats} utilization={utilization} activity={activity} />
}
```

### Prefetching Strategy

Prefetch data before user navigates:

```typescript
// Prefetch associates when hovering over link
const prefetchAssociates = () => {
  queryClient.prefetchQuery({
    queryKey: ['associates'],
    queryFn: fetchAssociates,
  })
}

<Link to="/associates" onMouseEnter={prefetchAssociates}>
  Associates
</Link>
```

### Lazy Loading Components

```typescript
const Dashboard = lazy(() => import('@/features/dashboard/components/DashboardPage'))
const Reports = lazy(() => import('@/features/reports/components/ReportsPage'))
const Settings = lazy(() => import('@/features/settings/components/SettingsPage'))

// With Suspense boundary
<Suspense fallback={<LoadingSpinner />}>
  <Dashboard />
</Suspense>
```

### Request Deduplication

React Query automatically deduplicates identical requests:

```typescript
// These three components all request same data
// React Query only makes ONE network request
function ComponentA() {
  const { data } = useAssociates()
  return <div>{data}</div>
}

function ComponentB() {
  const { data } = useAssociates()
  return <div>{data}</div>
}

function ComponentC() {
  const { data } = useAssociates()
  return <div>{data}</div>
}
```

### Garbage Collection

Unused query data is automatically cleaned up:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 10 * 60 * 1000, // Keep unused data for 10 minutes
    },
  },
})

// After 10 minutes of being unused, cached data is garbage collected
```

---

## Migration Guide

### From Old Architecture to DDD

**Before**:
```typescript
// Component with calculations
function AssociateCard({ associate }) {
  const workload = projects.filter(p => p.assignedTo === associate.id).length
  const utilization = (workload / associate.capacity) * 100
  
  return <Card>Utilization: {utilization}%</Card>
}
```

**After**:
```typescript
// Component only displays
function AssociateCard({ associate }) {
  return <Card>Utilization: {associate.utilization_percentage}%</Card>
}

// Service calculates
export class AssociateService {
  static async getAssociatesWithWorkload() {
    const associates = await repository.findAll()
    const workload = await repository.getWorkload()
    
    return associates.map(a => ({
      ...a,
      utilization_percentage: UtilizationCalculator.calculate(a, workload)
    }))
  }
}
```

---

## Benefits of This Architecture

### 1. Testability
- Domain logic can be tested without React
- Pure functions are easy to test
- Mocking is straightforward

### 2. Maintainability
- Business logic in one place
- Easy to find and update calculations
- Clear responsibilities per layer

### 3. Scalability
- Easy to add new features
- Can replace recommendation engine
- Can switch to microservices later

### 4. Reusability
- Domain logic can be used in:
  - Web UI
  - Mobile app
  - CLI tools
  - API endpoints
  - Background jobs

### 5. AI-Ready
- Strategy pattern allows easy AI integration
- Domain logic stays the same
- Just swap the strategy

---

## React Query Integration

### Data Fetching with Custom Hooks

All features use **React Query** for data fetching, caching, and state management:

```typescript
// Query hook example
export const useAssociates = () => {
  return useQuery({
    queryKey: ['associates'],
    queryFn: async () => {
      const result = await AssociateService.getAssociatesWithWorkload()
      if (result.error) throw new Error(result.error)
      return result.data || []
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Mutation hook example
export const useCreateAssociate = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: CreateAssociateInput) => {
      const result = await AssociateService.createAssociate(input)
      if (result.error) throw new Error(result.error)
      return result.data!
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['associates'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(`Associate "${data.name}" created successfully`)
    },
    onError: (error: Error) => {
      toast.error(`Failed to create associate: ${error.message}`)
    },
  })
}
```

### Hook Organization by Feature

Each feature has a dedicated hooks folder:

```
src/features/
├── associates/hooks/
│   ├── useAssociates.ts
│   ├── useCreateAssociate.ts
│   ├── useUpdateAssociate.ts
│   ├── useDeleteAssociate.ts
│   ├── useToggleAvailability.ts
│   ├── useSearchAssociates.ts
│   └── index.ts
│
├── projects/hooks/
│   ├── useProjects.ts
│   ├── useCreateProject.ts
│   ├── useUpdateProjectStatus.ts
│   ├── useProjectsByAssociate.ts
│   ├── useSearchProjects.ts
│   ├── useProjectStatistics.ts
│   └── index.ts
│
├── recommendation/hooks/
│   ├── useRecommendation.ts
│   ├── useBulkAssignmentSimulation.ts
│   └── index.ts
│
└── dashboard/hooks/
    ├── useDashboardStats.ts
    ├── useAssociateUtilization.ts
    ├── useRecentActivity.ts
    ├── useCapacityHeatmap.ts
    └── index.ts
```

### QueryClient Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: import.meta.env.PROD,
      retry: 1,
      staleTime: 5 * 60 * 1000,       // 5 minutes
      gcTime: 10 * 60 * 1000,         // 10 minutes
      throwOnError: false,
    },
    mutations: {
      retry: 0,
      throwOnError: false,
    },
  },
})
```

### Cache Invalidation Strategy

```typescript
// After creating/updating associate
queryClient.invalidateQueries({ queryKey: ['associates'] })
queryClient.invalidateQueries({ queryKey: ['dashboard'] })

// After creating/updating project
queryClient.invalidateQueries({ queryKey: ['projects'] })
queryClient.invalidateQueries({ queryKey: ['dashboard'] })
queryClient.invalidateQueries({ queryKey: ['project-statistics'] })

// After assignment
queryClient.invalidateQueries({ queryKey: ['associates'] })
queryClient.invalidateQueries({ queryKey: ['projects'] })
queryClient.invalidateQueries({ queryKey: ['dashboard'] })
queryClient.invalidateQueries({ queryKey: ['recommendation'] })
```

### Component Usage Pattern

```tsx
// 1. Import hooks
import { useAssociates, useCreateAssociate, useDeleteAssociate } from '@/features/associates/hooks'

// 2. Use in component
function AssociatesPage() {
  // Query hook for fetching data
  const { data: associates, isLoading, error } = useAssociates()
  
  // Mutation hooks for actions
  const createMutation = useCreateAssociate()
  const deleteMutation = useDeleteAssociate()
  
  // 3. Handle loading state
  if (isLoading) return <LoadingSpinner />
  
  // 4. Handle error state
  if (error) return <ErrorMessage error={error} />
  
  // 5. Render data
  return (
    <div>
      <Button onClick={() => createMutation.mutate(formData)}>
        Create Associate
      </Button>
      
      <Table data={associates} />
    </div>
  )
}
```

### Optimistic Updates Example

```typescript
export const useUpdateProjectStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, status }) => {
      const result = await ProjectService.updateProjectStatus(id, status)
      if (result.error) throw new Error(result.error)
      return result.data!
    },
    // Optimistic update - UI updates immediately
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['projects'] })
      
      const previousProjects = queryClient.getQueryData(['projects'])
      
      queryClient.setQueryData(['projects'], (old: any[]) =>
        old.map(p => p.id === id ? { ...p, status } : p)
      )
      
      return { previousProjects }
    },
    // Rollback on error
    onError: (err, variables, context) => {
      queryClient.setQueryData(['projects'], context?.previousProjects)
      toast.error('Failed to update project status')
    },
    // Refetch on success
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project status updated')
    },
  })
}
```

### Dependent Queries

```typescript
// Get projects for a specific associate
export const useProjectsByAssociate = (associateId: string | null) => {
  return useQuery({
    queryKey: ['projects', 'by-associate', associateId],
    queryFn: async () => {
      if (!associateId) return []
      const result = await ProjectService.getProjectsByAssociate(associateId)
      if (result.error) throw new Error(result.error)
      return result.data || []
    },
    enabled: !!associateId, // Only run when associateId exists
    staleTime: 1000 * 60 * 5,
  })
}

// Usage in component
function AssociateDetails({ associateId }) {
  const { data: projects } = useProjectsByAssociate(associateId)
  // projects will only fetch when associateId is provided
}
```

### React Query DevTools

Development environment includes React Query DevTools for debugging:

```typescript
// In App.tsx
{import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
```

**DevTools features**:
- View all queries and their states
- Inspect cached data
- Monitor refetch behavior
- Debug stale/fresh data
- Track mutation status

## Next Steps

1. ✅ Domain layer complete
2. ✅ Recommendation engine isolated
3. ✅ Repository layer complete
4. ✅ Application services refactored
5. ✅ Implement React Query hooks
6. ⏳ Build UI components using hooks
7. ⏳ Add comprehensive tests

---

## Key Takeaways

🎯 **The recommendation engine is the product**  
🎯 **The UI only displays results**  
🎯 **All calculations happen in the domain layer**  
🎯 **Services orchestrate, they don't calculate**  
🎯 **Repositories only do CRUD**  
🎯 **Everything is testable in isolation**

---

**This architecture ensures WBIPAS remains maintainable, testable, and scalable as it grows.**
