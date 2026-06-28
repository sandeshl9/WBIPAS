# WBIPAS - Quick Reference Guide

## 🚀 Quick Start

### Using Custom Hooks in Components

```typescript
// 1. Import the hook
import { useAssociates } from '@/features/associates/hooks'

// 2. Use in component
const { data, isLoading, error } = useAssociates()

// 3. Handle states
if (isLoading) return <LoadingSpinner />
if (error) return <ErrorMessage />
return <Display data={data} />
```

---

## 📁 Where to Put Things

| What | Where | Example |
|------|-------|---------|
| **UI Component** | `src/features/{feature}/components/` | `AssociatesPage.tsx` |
| **Service** | `src/features/{feature}/services/` | `AssociateService.ts` |
| **React Query Hook** | `src/features/{feature}/hooks/` | `useAssociates.ts` |
| **Validation Schema** | `src/features/{feature}/validators/` | `associateSchema.ts` |
| **Domain Calculator** | `src/domain/` | `WorkloadCalculator.ts` |
| **Repository** | `src/repositories/` | `AssociateRepository.ts` |
| **Shared UI Component** | `src/components/ui/` | `Button.tsx` |

---

## 🎣 Available Hooks

### Associates
```typescript
useAssociates()                          // Get all associates
useCreateAssociate()                     // Create associate
useUpdateAssociate()                     // Update associate
useDeleteAssociate()                     // Delete associate
useToggleAvailability()                  // Toggle availability
useSearchAssociates(query)               // Search associates
```

### Projects
```typescript
useProjects(options?)                    // Get projects
useCreateProject()                       // Create project
useUpdateProjectStatus()                 // Update status
useProjectsByAssociate(associateId)      // Get associate's projects
useSearchProjects(query)                 // Search projects
useProjectStatistics()                   // Get statistics
```

### Dashboard
```typescript
useDashboardStats()                      // Get dashboard stats
useAssociateUtilization()                // Get utilization data
useRecentActivity(limit?)                // Get recent activity
useCapacityHeatmap()                     // Get heatmap data
```

### Recommendation
```typescript
useRecommendation({ projectDate })       // Get recommendation
useBulkAssignmentSimulation({ projects }) // Simulate bulk assignment
```

---

## 🔧 Common Patterns

### Pattern 1: Fetch and Display Data

```typescript
function MyComponent() {
  const { data, isLoading, error } = useMyHook()
  
  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorAlert message={error.message} />
  
  return <MyTable data={data} />
}
```

### Pattern 2: Create/Update with Form

```typescript
function MyForm() {
  const createMutation = useCreateSomething()
  
  const onSubmit = (formData) => {
    createMutation.mutate(formData)
  }
  
  return (
    <form onSubmit={onSubmit}>
      {/* form fields */}
      <Button disabled={createMutation.isPending}>
        {createMutation.isPending ? 'Saving...' : 'Save'}
      </Button>
    </form>
  )
}
```

### Pattern 3: Dependent Data Loading

```typescript
function Details({ associateId }) {
  // Only loads when associateId exists
  const { data: projects } = useProjectsByAssociate(associateId)
  
  return <ProjectsList projects={projects} />
}
```

### Pattern 4: Search with Debouncing

```typescript
function SearchBox() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 500)
  
  const { data: results } = useSearchProjects(debouncedQuery)
  
  return (
    <>
      <Input value={query} onChange={(e) => setQuery(e.target.value)} />
      <SearchResults results={results} />
    </>
  )
}
```

---

## 🎨 Layer Rules

### ❌ DON'T

```typescript
// DON'T calculate in components
function MyComponent({ associate }) {
  const utilization = (associate.workload / associate.capacity) * 100 // ❌
  return <div>{utilization}%</div>
}

// DON'T put business logic in services
export class MyService {
  static async getData() {
    const data = await repo.fetch()
    const calculated = data.map(d => d.value * 100) // ❌
    return calculated
  }
}

// DON'T put queries in repositories
export class MyRepository {
  static async getWithCalculation() {
    const data = await supabase.from('table').select()
    return data.map(d => ({ ...d, calculated: d.value * 2 })) // ❌
  }
}
```

### ✅ DO

```typescript
// DO use domain calculators in components
function MyComponent({ associate }) {
  const utilization = UtilizationCalculator.calculate(
    associate.workload, 
    associate.capacity
  ) // ✅
  return <div>{utilization}%</div>
}

// DO orchestrate in services
export class MyService {
  static async getData() {
    const data = await repo.fetch()
    const calculated = data.map(d => 
      DomainCalculator.calculate(d) // ✅
    )
    return calculated
  }
}

// DO keep repositories simple
export class MyRepository {
  static async getAll() {
    const { data, error } = await supabase
      .from('table')
      .select() // ✅
    return { data, error }
  }
}
```

---

## 🧮 Domain Calculators

### Capacity

```typescript
import { CapacityCalculator } from '@/domain/CapacityCalculator'

CapacityCalculator.isValidCapacity(value)
CapacityCalculator.calculateUtilization(workload, capacity)
```

### Workload

```typescript
import { WorkloadCalculator } from '@/domain/WorkloadCalculator'

WorkloadCalculator.calculateTotalWorkload(projects)
WorkloadCalculator.calculateActiveWorkload(associate)
WorkloadCalculator.calculateAvailableCapacity(capacity, workload)
WorkloadCalculator.hasCapacity(capacity, workload)
```

### Utilization

```typescript
import { UtilizationCalculator } from '@/domain/UtilizationCalculator'

UtilizationCalculator.calculateTeamUtilization(data)
UtilizationCalculator.calculateAverageWorkload(data)
UtilizationCalculator.calculateAvailableCapacity(data)
UtilizationCalculator.getUtilizationHealth(percentage)
UtilizationCalculator.calculateUtilization(workload, capacity)
UtilizationCalculator.calculateAverageUtilization(associates, workload)
```

---

## 📊 React Query Configuration

### Default Settings

```typescript
queries: {
  refetchOnWindowFocus: false (dev) / true (prod)
  retry: 1
  staleTime: 5 minutes
  gcTime: 10 minutes
  throwOnError: false
}

mutations: {
  retry: 0
  throwOnError: false
}
```

### Cache Invalidation

```typescript
// After creating/updating associate
queryClient.invalidateQueries({ queryKey: ['associates'] })
queryClient.invalidateQueries({ queryKey: ['dashboard'] })

// After creating/updating project
queryClient.invalidateQueries({ queryKey: ['projects'] })
queryClient.invalidateQueries({ queryKey: ['dashboard'] })
queryClient.invalidateQueries({ queryKey: ['project-statistics'] })
```

---

## 🔍 Debugging

### React Query DevTools

```typescript
// Press F12 in development mode
// Look for React Query tab in DevTools
// View all queries, mutations, and cache
```

### Common Issues

**Issue: Data not updating**
```typescript
// Check if invalidation is happening
queryClient.invalidateQueries({ queryKey: ['your-key'] })
```

**Issue: Too many requests**
```typescript
// Increase staleTime
useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
  staleTime: 1000 * 60 * 5, // 5 minutes
})
```

**Issue: Query not running**
```typescript
// Check enabled flag
useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
  enabled: !!someCondition, // Make sure this is true
})
```

---

## 📦 Import Paths

```typescript
// Feature hooks
import { useAssociates } from '@/features/associates/hooks'

// Feature services
import { AssociateService } from '@/features/associates/services/AssociateService'

// Domain calculators
import { WorkloadCalculator } from '@/domain/WorkloadCalculator'

// Repositories
import { AssociateRepository } from '@/repositories/AssociateRepository'

// Recommendation engine
import { AssignmentEngine } from '@/recommendation-engine'

// UI components
import { Button } from '@/components/ui/Button'

// Utilities
import { toast } from '@/lib/toast'
```

---

## 🎯 Best Practices

### 1. Always use custom hooks, never call services directly in components

```typescript
// ❌ Bad
function MyComponent() {
  const [data, setData] = useState()
  useEffect(() => {
    AssociateService.getAll().then(setData)
  }, [])
}

// ✅ Good
function MyComponent() {
  const { data } = useAssociates()
}
```

### 2. Keep components simple

```typescript
// ❌ Bad - component has too much logic
function MyComponent() {
  const [data, setData] = useState()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState()
  // ... lots of logic
}

// ✅ Good - hook handles everything
function MyComponent() {
  const { data, isLoading, error } = useMyHook()
}
```

### 3. Use domain calculators for all calculations

```typescript
// ❌ Bad
const utilization = (workload / capacity) * 100

// ✅ Good
const utilization = UtilizationCalculator.calculate(workload, capacity)
```

### 4. Show loading and error states

```typescript
function MyComponent() {
  const { data, isLoading, error } = useMyHook()
  
  // ✅ Always handle these states
  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorAlert error={error} />
  
  return <Display data={data} />
}
```

### 5. Use optimistic updates for better UX

```typescript
const updateMutation = useUpdateSomething({
  onMutate: async (newData) => {
    // Cancel refetch
    await queryClient.cancelQueries({ queryKey: ['data'] })
    
    // Optimistically update
    queryClient.setQueryData(['data'], newData)
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(['data'], context.previousData)
  },
})
```

---

## 🚨 Common Mistakes

1. **Calculating in components** → Use domain calculators
2. **Calling services directly** → Use custom hooks
3. **Not handling loading/error** → Always show loading and error states
4. **Forgetting to invalidate cache** → Invalidate after mutations
5. **Too short staleTime** → Increase for data that changes less frequently
6. **Missing enabled flag** → Use enabled for dependent queries

---

## 💡 Tips

- Use React Query DevTools to inspect cache
- Set appropriate staleTime for each query type
- Invalidate related queries after mutations
- Use optimistic updates for instant feedback
- Prefetch data on hover for faster navigation
- Keep domain logic in domain layer
- Use Zod schemas for all form validation

---

## 📚 Further Reading

- **DDD_ARCHITECTURE.md** - Complete architecture guide
- **REFACTORING_SUMMARY.md** - What was changed and why
- **React Query Docs** - https://tanstack.com/query/latest/docs/react
- **Zod Docs** - https://zod.dev

---

**Happy coding! 🎉**
