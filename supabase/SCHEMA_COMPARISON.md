# Schema Comparison: Current vs Enterprise (Volume 3)

## Executive Summary

The current schema (10 tables) needs to be upgraded to the enterprise design (12 tables) with additional features for production-grade operation.

---

## Gap Analysis

### ✅ Tables Already Exist (with enhancements needed)

| Table | Status | Required Changes |
|-------|--------|------------------|
| users | ✅ EXISTS | Rename to `profiles`, add `avatar_url`, enhance role enum |
| associates | ✅ EXISTS | Add `employee_code` (rename from employee_id), `availability_status` enum, `designation` |
| capacities | ✅ EXISTS | Replace with `capacity_history` (add `effective_from`, `effective_to`, `created_by`) |
| projects | ✅ EXISTS | Add `project_code` field, enhance `source` enum with 'bulk_assignment' |
| assignments | ✅ EXISTS | Add `assignment_engine_version`, `recommendation_id` FK |
| recommendations | ✅ EXISTS | Rename to `recommendation_logs`, add `recommended_rank`, `algorithm_version`, `accepted` |
| opening_balance | ✅ EXISTS | Move to unified `import_history` |
| opening_balance_import_logs | ✅ EXISTS | Consolidate into `import_history` |
| audit_logs | ✅ EXISTS | Already enterprise-grade ✓ |
| settings | ✅ EXISTS | Add `fifo_enabled`, `capacity_rule` fields |

### ❌ Tables Missing (need to create)

| Table | Purpose | Priority |
|-------|---------|----------|
| **holidays** | National/state holidays for capacity reduction | HIGH |
| **activity_logs** | Dashboard timeline feed (separate from audit_logs) | HIGH |
| **notifications** | Future-ready notifications system | LOW (Future) |

### 📊 Views Missing

| View | Purpose |
|------|---------|
| **v_current_workload** | Real-time workload per associate |
| **v_weekly_capacity** | Current week capacity utilization |
| **v_dashboard_kpis** | Single-query dashboard metrics |

### ⚙️ Stored Procedures Missing

| Procedure | Purpose |
|-----------|---------|
| **assign_project()** | Atomic project assignment with validation, audit, activity logging |

### 🔔 Triggers Missing

| Trigger | Purpose |
|---------|---------|
| **on_project_completed** | Auto-refresh workload when project completed |
| **on_capacity_changed** | Auto-insert capacity_history |
| **on_assignment_created** | Auto-insert activity_log |
| **on_recommendation_accepted** | Mark recommendation as accepted |
| **on_recommendation_override** | Auto-create audit log entry |

---

## Detailed Changes Required

### 1. Profiles Table (rename from users)

```sql
-- Current
users (id, email, full_name, role, created_at, updated_at)

-- Enterprise
profiles (
  id, 
  full_name, 
  email, 
  role ENUM('manager', 'admin', 'supervisor', 'viewer'), -- Enhanced
  avatar_url TEXT, -- NEW
  is_active BOOLEAN, -- NEW
  created_at, 
  updated_at
)
```

**Changes:**
- Add `avatar_url` for profile pictures
- Add `is_active` for soft delete
- Convert `role` to proper ENUM

---

### 2. Associates Table Enhancements

```sql
-- Current
associates (
  id, employee_id, name, email, weekly_capacity,
  department, skills, is_available, is_active,
  created_at, updated_at, created_by
)

-- Enterprise
associates (
  id,
  employee_code TEXT, -- RENAMED from employee_id
  associate_name TEXT, -- RENAMED from name
  email,
  default_weekly_capacity INTEGER, -- RENAMED from weekly_capacity
  availability_status ENUM(...), -- NEW (replaces is_available boolean)
  department,
  designation TEXT, -- NEW
  is_active,
  created_by,
  created_at,
  updated_at
)
```

**New ENUM:**
```sql
CREATE TYPE availability_status AS ENUM (
  'available',
  'leave',
  'training',
  'holiday',
  'inactive'
);
```

**Changes:**
- `employee_id` → `employee_code` (more accurate naming)
- `name` → `associate_name` (clarity)
- `weekly_capacity` → `default_weekly_capacity` (clarity)
- `is_available` → `availability_status` ENUM (more granular)
- Add `designation` field

---

### 3. Capacity History Table (replace capacities)

```sql
-- Current
capacities (
  id, associate_id, week_number, year,
  weekly_capacity, created_at, updated_at
)

-- Enterprise
capacity_history (
  id,
  associate_id FK,
  week_number,
  year,
  capacity INTEGER,
  effective_from DATE, -- NEW
  effective_to DATE, -- NEW
  created_by UUID FK, -- NEW
  created_at
)
```

**Changes:**
- Add `effective_from` and `effective_to` for date ranges
- Add `created_by` for audit trail
- Remove `updated_at` (history is immutable)
- Rename `weekly_capacity` → `capacity` (simpler)

**Important:** Historical records are NEVER modified.

---

### 4. Projects Table Enhancements

```sql
-- Current
projects (
  id, project_id, project_name, client, project_date,
  week_number, year, priority, status, comments,
  assigned_associate_id, assigned_associate_name,
  completion_date, source, created_by, created_at, updated_at
)

-- Enterprise  
projects (
  id,
  project_code TEXT, -- NEW (business identifier)
  project_id TEXT, -- Keep for backwards compatibility
  project_name,
  client_name, -- RENAMED from client
  project_date,
  week_number,
  year,
  priority,
  status,
  comments,
  source ENUM('manual', 'opening_balance', 'api', 'import', 'bulk_assignment'), -- ENHANCED
  created_by,
  created_at,
  updated_at
)
```

**Changes:**
- Add `project_code` as primary business identifier
- Enhance `source` enum with 'bulk_assignment'
- Rename `client` → `client_name` (clarity)

---

### 5. Assignments Table Enhancements

```sql
-- Current
assignments (
  id, project_id, associate_id, assigned_by, assigned_at,
  recommended_associate_id, override_reason, is_override
)

-- Enterprise
assignments (
  id,
  project_id FK,
  associate_id FK,
  assigned_date TIMESTAMPTZ, -- RENAMED from assigned_at
  assignment_engine_version TEXT, -- NEW
  recommendation_id UUID FK, -- NEW
  is_manual_override BOOLEAN, -- RENAMED from is_override
  override_reason TEXT,
  assigned_by UUID FK,
  created_at
)
```

**Changes:**
- Add `assignment_engine_version` for traceability
- Add `recommendation_id` to link to recommendation_logs
- `assigned_at` → `assigned_date` (consistency)
- `is_override` → `is_manual_override` (clarity)
- Remove `recommended_associate_id` (use recommendation_id link instead)

---

### 6. Recommendation Logs Table (rename from recommendations)

```sql
-- Current
recommendations (
  id, project_id, recommended_associate_id, recommended_associate_name,
  workload_before, workload_after, explanation,
  was_accepted, actual_assigned_associate_id, created_at
)

-- Enterprise
recommendation_logs (
  id,
  project_id FK,
  recommended_associate UUID FK,
  recommended_rank INTEGER, -- NEW
  recommendation_reason TEXT, -- RENAMED from explanation
  workload INTEGER, -- SIMPLIFIED from workload_before/after
  capacity INTEGER, -- NEW
  fifo_date DATE, -- NEW
  algorithm_version TEXT, -- NEW
  accepted BOOLEAN, -- RENAMED from was_accepted
  created_at
)
```

**Changes:**
- Add `recommended_rank` for multi-candidate recommendations
- Add `algorithm_version` for A/B testing
- Add `fifo_date` for tie-breaking visibility
- Add `capacity` alongside workload
- Simplify workload fields
- Remove `actual_assigned_associate_id` (use assignments table)

---

### 7. Import History Table (consolidate opening_balance tables)

```sql
-- Current (2 tables)
opening_balance (...)
opening_balance_import_logs (...)

-- Enterprise (1 unified table)
import_history (
  id,
  file_name TEXT,
  import_type ENUM('opening_balance', 'projects', 'associates', 'capacity'),
  records INTEGER, -- total
  success_count INTEGER,
  failed_count INTEGER,
  imported_by UUID FK,
  created_at
)
```

**New ENUM:**
```sql
CREATE TYPE import_type AS ENUM (
  'opening_balance',
  'projects',
  'associates',
  'capacity'
);
```

**Changes:**
- Consolidate two tables into one
- Support multiple import types
- Remove `batch_id`, use `id` as batch identifier
- Remove `errors` JSONB, log errors separately

---

### 8. Holidays Table (NEW)

```sql
CREATE TABLE holidays (
  id UUID PRIMARY KEY,
  holiday_name TEXT NOT NULL,
  holiday_date DATE NOT NULL,
  country TEXT,
  state TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Purpose:**
- Track national and state holidays
- Future: Automatic capacity reduction on holidays
- Support multi-country/state operations

---

### 9. Activity Logs Table (NEW)

```sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  entity TEXT, -- 'project', 'associate', 'assignment'
  entity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Purpose:**
- Dashboard timeline feed
- User-friendly activity descriptions
- Separate from detailed audit_logs
- Quick dashboard queries

---

### 10. Notifications Table (NEW - Future)

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID FK,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  type TEXT, -- 'assignment', 'capacity_change', 'system'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Purpose:**
- Future email notifications
- In-app notifications
- User communication system

---

## Views to Create

### 1. v_current_workload

```sql
CREATE VIEW v_current_workload AS
SELECT 
  associate_id,
  COUNT(*) as active_project_count
FROM (
  SELECT assigned_associate_id as associate_id
  FROM projects
  WHERE status NOT IN ('completed', 'cancelled')
  UNION ALL
  SELECT assigned_associate_id as associate_id
  FROM opening_balance
) workload
GROUP BY associate_id;
```

### 2. v_weekly_capacity

```sql
CREATE VIEW v_weekly_capacity AS
SELECT 
  a.id as associate_id,
  a.associate_name,
  COALESCE(ch.capacity, a.default_weekly_capacity) as capacity,
  w.active_project_count,
  COALESCE(ch.capacity, a.default_weekly_capacity) - COALESCE(w.active_project_count, 0) as remaining
FROM associates a
LEFT JOIN capacity_history ch ON ch.associate_id = a.id 
  AND EXTRACT(WEEK FROM CURRENT_DATE) = ch.week_number
  AND EXTRACT(YEAR FROM CURRENT_DATE) = ch.year
LEFT JOIN v_current_workload w ON w.associate_id = a.id;
```

### 3. v_dashboard_kpis

```sql
CREATE VIEW v_dashboard_kpis AS
SELECT 
  (SELECT COUNT(*) FROM associates WHERE is_active = TRUE) as total_associates,
  (SELECT COUNT(*) FROM projects) as total_projects,
  -- ... more KPIs
FROM (SELECT 1) dummy;
```

---

## Stored Procedures to Create

### assign_project()

```sql
CREATE OR REPLACE FUNCTION assign_project(
  p_project_id UUID,
  p_associate_id UUID,
  p_assigned_by UUID,
  p_recommendation_id UUID DEFAULT NULL,
  p_override_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_assignment_id UUID;
BEGIN
  -- Start transaction
  BEGIN
    -- 1. Validate associate has capacity
    IF NOT has_capacity(p_associate_id, ...) THEN
      RAISE EXCEPTION 'Associate has no capacity';
    END IF;
    
    -- 2. Update project
    UPDATE projects SET
      assigned_associate_id = p_associate_id,
      status = 'assigned',
      updated_at = NOW()
    WHERE id = p_project_id;
    
    -- 3. Create assignment record
    INSERT INTO assignments (...) VALUES (...) RETURNING id INTO v_assignment_id;
    
    -- 4. Update recommendation if provided
    IF p_recommendation_id IS NOT NULL THEN
      UPDATE recommendation_logs SET accepted = TRUE WHERE id = p_recommendation_id;
    END IF;
    
    -- 5. Create audit log
    INSERT INTO audit_logs (...) VALUES (...);
    
    -- 6. Create activity log
    INSERT INTO activity_logs (...) VALUES (...);
    
    -- 7. Return success
    v_result := jsonb_build_object('success', true, 'assignment_id', v_assignment_id);
    RETURN v_result;
    
  EXCEPTION WHEN OTHERS THEN
    -- Rollback handled automatically
    RAISE;
  END;
END;
$$ LANGUAGE plpgsql;
```

---

## Triggers to Create

### 1. on_project_completed

```sql
CREATE OR REPLACE FUNCTION trigger_refresh_workload()
RETURNS TRIGGER AS $$
BEGIN
  -- Refresh materialized view or cache
  -- Trigger when project status changes to 'completed'
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_project_completed
AFTER UPDATE OF status ON projects
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION trigger_refresh_workload();
```

### 2. on_capacity_changed

```sql
CREATE OR REPLACE FUNCTION trigger_capacity_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-insert into capacity_history when associate capacity changes
  INSERT INTO capacity_history (
    associate_id,
    week_number,
    year,
    capacity,
    effective_from,
    created_by
  ) VALUES (
    NEW.id,
    EXTRACT(WEEK FROM CURRENT_DATE),
    EXTRACT(YEAR FROM CURRENT_DATE),
    NEW.default_weekly_capacity,
    CURRENT_DATE,
    NEW.created_by
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_capacity_changed
AFTER UPDATE OF default_weekly_capacity ON associates
FOR EACH ROW
WHEN (OLD.default_weekly_capacity IS DISTINCT FROM NEW.default_weekly_capacity)
EXECUTE FUNCTION trigger_capacity_history();
```

### 3-5. Similar patterns for assignments, recommendations

---

## Migration Strategy

### Phase 1: Additive Changes (Zero Downtime)
1. Create new tables (holidays, activity_logs, notifications)
2. Add new columns to existing tables
3. Create new enums
4. Create new views
5. Create new functions/procedures
6. Create new triggers

### Phase 2: Data Migration
1. Migrate capacities → capacity_history
2. Migrate recommendations → recommendation_logs
3. Migrate opening_balance → import_history

### Phase 3: Deprecation (After migration)
1. Archive old tables
2. Update application code
3. Drop old tables (after backup)

---

## Indexes to Add

```sql
-- Holidays
CREATE INDEX idx_holidays_date ON holidays(holiday_date);
CREATE INDEX idx_holidays_country ON holidays(country);

-- Activity Logs
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity, entity_id);

-- Import History
CREATE INDEX idx_import_history_type ON import_history(import_type);
CREATE INDEX idx_import_history_created_at ON import_history(created_at DESC);
```

---

## Summary

**Existing Tables:** 10  
**Enterprise Tables:** 12  
**New Tables:** 3 (holidays, activity_logs, notifications)  
**Tables to Rename:** 2 (users → profiles, recommendations → recommendation_logs)  
**Tables to Replace:** 2 (capacities → capacity_history, opening_balance tables → import_history)  
**New Views:** 3  
**New Procedures:** 1  
**New Triggers:** 5  
**New Enums:** 2 (availability_status, import_type)  

**Estimated Migration Time:** 2-4 hours  
**Downtime Required:** None (blue-green deployment)  
**Risk Level:** Low (additive changes, backwards compatible)

---

**Next Step:** Create migration script `20240628000000_enterprise_upgrade.sql`
