# WBIPAS Architecture Documentation

## System Architecture

### Overview

WBIPAS is built using a modern, serverless architecture leveraging Supabase as the backend-as-a-service platform. The system follows clean architecture principles with clear separation of concerns.

```
┌─────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   React UI   │  │   Routing    │  │   Contexts   │     │
│  │  Components  │  │  (Protected) │  │  Auth/Theme  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                     BUSINESS LOGIC LAYER                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Services (API Layer)                     │  │
│  │  • Auth        • Associates    • Projects            │  │
│  │  • Audit       • Recommendations • Assignments       │  │
│  │  • Settings    • Opening Balance                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                      DATA ACCESS LAYER                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Supabase Client (TypeScript)               │  │
│  │  • Type-safe queries  • Real-time subscriptions     │  │
│  │  • Authentication     • Storage (future)            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                        DATABASE LAYER                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              PostgreSQL (Supabase)                   │  │
│  │  • Tables          • Views                          │  │
│  │  • Functions       • Triggers                       │  │
│  │  • RLS Policies    • Indexes                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Presentation Layer

#### Pages
High-level route components that compose multiple features:
- `DashboardPage`: KPIs, charts, recent activity
- `AssociatesPage`: Associate management interface
- `ProjectsPage`: Project management and assignment
- `ReportsPage`: Report generation and export
- `SettingsPage`: System configuration
- `LoginPage`: Authentication

#### Components Structure
```
components/
├── ui/              # Atomic, reusable components
│   ├── Button
│   ├── Card
│   ├── Input
│   ├── Table
│   └── Dialog
├── layout/          # Layout components
│   ├── Layout
│   ├── Sidebar
│   └── Header
├── associates/      # Feature-specific components
├── projects/
├── dashboard/
├── reports/
└── settings/
```

#### State Management

**Server State**: React Query
- Caching API responses
- Automatic refetching
- Optimistic updates
- Background synchronization

**Client State**: React Context
- `AuthContext`: User authentication state
- `ThemeContext`: UI theme preferences

**Local State**: React useState/useReducer
- Component-specific state
- Form inputs
- UI toggles

---

## Service Layer Architecture

### Service Responsibilities

Each service handles a specific domain:

```typescript
// Example: associatesService.ts
export const associatesService = {
  // CRUD operations
  getAssociates()
  getAssociateById(id)
  createAssociate(input)
  updateAssociate(id, input)
  deleteAssociate(id)
  
  // Business logic
  getAssociatesWithWorkload()
  getAssociateWorkload(id, week, year)
  checkAssociateCapacity(id, week, year)
  toggleAssociateAvailability(id)
  
  // Each operation includes:
  // 1. Input validation
  // 2. Database query via Supabase
  // 3. Error handling
  // 4. Audit logging (where applicable)
}
```

### Service Patterns

**1. Error Handling**
```typescript
try {
  const { data, error } = await supabase
    .from('table')
    .select()
  
  if (error) throw error
  return { data, error: null }
} catch (error: any) {
  console.error('Error message:', error)
  return { data: null, error: error.message }
}
```

**2. Audit Logging**
```typescript
// After successful operation
await createAuditLog({
  action: 'create_associate',
  entityType: 'associate',
  entityId: data.id,
  newValue: data,
})
```

**3. Type Safety**
All services use TypeScript types from `src/types/`:
- Application types (`index.ts`)
- Database types (`database.ts`)

---

## Database Architecture

### Schema Design Principles

1. **Normalization**: 3NF for data integrity
2. **Denormalization**: Strategic (e.g., `assigned_associate_name` in projects)
3. **Indexing**: All frequently queried columns
4. **Constraints**: Enforce business rules at DB level
5. **Triggers**: Auto-update timestamps, calculate weeks
6. **Functions**: Reusable business logic
7. **Views**: Materialized for performance

### Data Relationships

```
users (1) ─────┬─── (∞) associates
               │
               ├─── (∞) projects
               │
               └─── (∞) audit_logs

associates (1) ─┬─── (∞) capacities
                │
                ├─── (∞) projects (assigned)
                │
                ├─── (∞) assignments
                │
                ├─── (∞) recommendations
                │
                └─── (∞) opening_balance

projects (1) ───┬─── (1) assignments
                │
                └─── (∞) recommendations
```

### Key Database Features

**1. Capacity Management**
- Associates have default `weekly_capacity`
- Override with week-specific entries in `capacities` table
- Function `get_associate_capacity()` handles fallback logic

**2. Workload Calculation**
- Real-time via `v_associates_with_workload` view
- Historical via `get_associate_workload()` function
- Includes both projects and opening balance

**3. Audit Trail**
- Every business action logged
- Stores before/after values (JSONB)
- Supports compliance and debugging

**4. Row-Level Security**
- All tables have RLS enabled
- Manager role can perform all operations
- Associates can view (future: own data only)
- Audit logs: users see own, managers see all

---

## Recommendation Engine Architecture

### Algorithm Flow

```
Input: Project Date
  ↓
Step 1: Calculate Week/Year
  ↓
Step 2: Get Active & Available Associates
  ↓
Step 3: Filter by Capacity
  [Call: has_capacity(associate, week, year)]
  ↓
Step 4: Calculate Workloads
  [Call: get_associate_workload(associate, week, year)]
  ↓
Step 5: Find Minimum Workload
  ↓
Step 6: FIFO Tie-Breaking
  [Call: get_oldest_project_date(associate)]
  ↓
Step 7: Alphabetical Tie-Breaking
  ↓
Step 8: Generate Explanation
  ↓
Output: Recommended Associate + Explanation
```

### Key Design Decisions

**Why Sequential Bulk Assignment?**
- Ensures each project sees accurate workload
- Prevents all projects going to same associate
- More fair distribution
- Slightly slower but more correct

**Why FIFO Tie-Breaking?**
- Rewards associates who completed work earlier
- Incentivizes fast completion
- Fair temporal distribution

**Why Alphabetical Final Tie-Breaker?**
- Deterministic (same input = same output)
- No randomness
- Predictable for testing and auditing

---

## Security Architecture

### Authentication Flow

```
1. User enters credentials
   ↓
2. Supabase Auth validates
   ↓
3. JWT token issued
   ↓
4. Token stored in localStorage
   ↓
5. Token included in all API requests
   ↓
6. RLS policies validate token
   ↓
7. Query executed if authorized
```

### RLS Policy Pattern

```sql
-- Example: Associates table
CREATE POLICY "Managers can view all associates"
  ON public.associates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'manager'
    )
  );
```

### Security Layers

1. **Network**: HTTPS only
2. **Authentication**: JWT tokens
3. **Authorization**: RLS policies
4. **Input Validation**: Client + Server
5. **SQL Injection**: Prevented by Supabase client
6. **XSS**: React auto-escapes
7. **CSRF**: Not applicable (stateless API)

---

## Performance Architecture

### Frontend Performance

**Code Splitting** (Future)
```typescript
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const AssociatesPage = lazy(() => import('./pages/AssociatesPage'))
```

**Memoization**
```typescript
const expensiveCalculation = useMemo(() => {
  return calculateWorkload(data)
}, [data])
```

**Debouncing**
```typescript
const debouncedSearch = debounce(searchFunction, 300)
```

### Backend Performance

**Database Optimization**
- Strategic indexes on all queries
- Composite indexes for common filters
- Full-text search indexes (GIN)
- Materialized views for complex queries

**Query Optimization**
- Select only needed columns
- Use database functions for calculations
- Batch operations where possible
- Connection pooling (automatic in Supabase)

**Caching Strategy**
- React Query caches for 5 minutes
- Browser caches static assets
- Database query plan caching

---

## Scalability Architecture

### Current Scale

- **Associates**: 10,000+
- **Projects**: 1,000,000+
- **Concurrent Users**: 100

### Horizontal Scaling

Supabase handles automatically:
- Database connection pooling
- Read replicas
- Load balancing
- Auto-scaling

### Vertical Scaling

If needed:
1. Upgrade Supabase plan
2. Add database indexes
3. Partition large tables by year
4. Materialize expensive views

### Future Multi-Tenancy

Architecture ready for:
```sql
ALTER TABLE associates ADD COLUMN organization_id UUID;
ALTER TABLE projects ADD COLUMN organization_id UUID;

-- Update all RLS policies to filter by organization_id
```

---

## Error Handling Architecture

### Error Flow

```
Error occurs
  ↓
Service catches error
  ↓
Log to console (development)
  ↓
Return { data: null, error: message }
  ↓
Component receives error
  ↓
Display user-friendly message
  ↓
Optional: Toast notification
```

### Error Types

1. **Validation Errors**: User input issues
2. **Authentication Errors**: Login failures
3. **Authorization Errors**: Permission denied
4. **Database Errors**: Query failures
5. **Network Errors**: Connection issues
6. **Business Logic Errors**: Capacity exceeded, etc.

### Error Handling Pattern

```typescript
// In service
export async function createAssociate(input) {
  try {
    // Validation
    if (!input.email) {
      throw new Error('Email is required')
    }
    
    // Database operation
    const { data, error } = await supabase
      .from('associates')
      .insert(input)
    
    if (error) throw error
    
    return { data, error: null }
  } catch (error: any) {
    console.error('Error creating associate:', error)
    return { 
      data: null, 
      error: error.message || 'Unknown error occurred' 
    }
  }
}

// In component
const handleCreate = async () => {
  const { data, error } = await createAssociate(formData)
  
  if (error) {
    setError(error)
    toast.error(error)
    return
  }
  
  toast.success('Associate created successfully')
  navigate('/associates')
}
```

---

## Testing Architecture (Future)

### Test Pyramid

```
     ╱ ╲     E2E Tests (Few)
    ╱───╲    Integration Tests (Some)
   ╱─────╲   Unit Tests (Many)
  ╱───────╲
```

### Testing Strategy

**Unit Tests**
- Services: Mock Supabase client
- Utils: Pure function testing
- Hooks: React Testing Library

**Integration Tests**
- Component + Service
- Full user flows
- Mock API responses

**E2E Tests** (Playwright/Cypress)
- Critical paths
- Assignment workflow
- Report generation

---

## Deployment Architecture

### Development

```
Developer
  ↓
npm run dev (Vite)
  ↓
localhost:5173
  ↓
Supabase Dev Project
```

### Production

```
GitHub
  ↓
Vercel/Netlify (CI/CD)
  ↓
Build Process
  ↓
CDN (Static Assets)
  ↓
Users
  ↓
Supabase Production
```

### Environments

1. **Development**: Local + Supabase Dev
2. **Staging**: Deployed + Supabase Staging
3. **Production**: Deployed + Supabase Production

---

## Monitoring & Observability (Future)

### Metrics to Track

**Application Metrics**
- Page load times
- API response times
- Error rates
- User sessions

**Business Metrics**
- Assignments per day
- Recommendation acceptance rate
- Average workload
- Capacity utilization

**Infrastructure Metrics**
- Database query times
- Connection pool usage
- Database size
- API rate limits

### Tools

- **Supabase Dashboard**: Database metrics
- **Vercel Analytics**: Frontend performance
- **Sentry**: Error tracking (future)
- **PostHog**: Product analytics (future)

---

## Conclusion

WBIPAS is built with modern, scalable architecture principles:

✅ **Clean separation of concerns**
✅ **Type-safe throughout**
✅ **Security by default**
✅ **Performance optimized**
✅ **Horizontally scalable**
✅ **Maintainable codebase**
✅ **Future-proof design**

The architecture supports current requirements while being flexible enough to accommodate future enhancements like AI recommendations, multi-tenancy, and mobile apps.
