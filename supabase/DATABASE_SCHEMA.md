# WBIPAS Database Schema Documentation

## Overview

The WBIPAS database follows an **enterprise-grade design** with 12 core tables, supporting a deterministic, fair, and auditable project assignment system. The schema follows best practices with proper normalization, strategic indexing, complete audit trails, and Row-Level Security (RLS).

**Version:** 2.0.0 (Enterprise)  
**Last Updated:** June 28, 2026  
**Migration:** 20240628000000_enterprise_upgrade.sql

## Architecture Principles

1. **ACID Compliance**: All critical operations use database transactions
2. **Immutable History**: Capacity and recommendation history never modified
3. **Complete Audit Trail**: Every business action logged in audit_logs and activity_logs
4. **Strategic Indexing**: 60+ indexes on frequently queried columns
5. **Scalability**: Designed for 10,000+ associates and 1,000,000+ projects
6. **Security**: Row-Level Security (RLS) on all 12 tables
7. **Data Integrity**: Foreign keys, check constraints, and triggers
8. **Performance**: Views and stored procedures for complex operations

## Enterprise Enhancements (v2.0)

### New in Version 2.0

- ✅ **3 new tables** (holidays, activity_logs, notifications)
- ✅ **Enhanced capacity tracking** with immutable history
- ✅ **Advanced recommendations** with ranking and A/B testing
- ✅ **Unified import history** for all data types
- ✅ **Atomic assignment procedure** with rollback
- ✅ **5 business triggers** for automation
- ✅ **3 optimized views** for dashboard performance
- ✅ **6 helper functions** for common operations

---

## Entity Relationship Diagram

```
auth.users (Supabase)
    ↓
profiles (1)
    ↓
    ├─→ associates (many)
    │      ↓
    │      ├─→ capacity_history (many, immutable)
    │      ├─→ assignments (many)
    │      └─→ opening_balance (many)
    │
    ├─→ projects (many)
    │      ↓
    │      ├─→ assignments (1)
    │      └─→ recommendation_logs (many)
    │
    ├─→ audit_logs (many)
    ├─→ activity_logs (many)
    ├─→ notifications (many)
    └─→ import_history (many)

holidays (standalone)
settings (singleton)
```

**Key:** Projects are the single source of truth, driving all assignments.

## Database Tables

### Core Tables

#### 1. users
Extends `auth.users` with application-specific data.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | References auth.users(id) |
| email | TEXT | User email (unique) |
| full_name | TEXT | User's full name |
| role | TEXT | User role (default: 'manager') |
| created_at | TIMESTAMPTZ | Record creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Indexes:**
- `idx_users_email` on `email`
- `idx_users_role` on `role`

---

#### 2. associates
Associates who can be assigned projects.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Primary key |
| employee_id | TEXT | Employee ID (unique) |
| name | TEXT | Associate name |
| email | TEXT | Email address (unique) |
| weekly_capacity | INTEGER | Default weekly capacity (1-100) |
| department | TEXT | Department (optional, for future use) |
| skills | TEXT[] | Skills array (optional, for future use) |
| is_available | BOOLEAN | Availability status |
| is_active | BOOLEAN | Active/inactive status |
| created_at | TIMESTAMPTZ | Record creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |
| created_by | UUID (FK) | User who created the record |

**Constraints:**
- `chk_weekly_capacity`: Capacity must be between 1 and 100

**Indexes:**
- `idx_associates_employee_id` on `employee_id`
- `idx_associates_email` on `email`
- `idx_associates_is_active` on `is_active`
- `idx_associates_is_available` on `is_available`
- `idx_associates_department` on `department`
- `idx_associates_name_fts` full-text search on `name`

---

#### 3. capacities
Week-specific capacity overrides for associates.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Primary key |
| associate_id | UUID (FK) | References associates(id) |
| week_number | INTEGER | Week number (1-53) |
| year | INTEGER | Year (2020-2100) |
| weekly_capacity | INTEGER | Capacity for this week (1-100) |
| created_at | TIMESTAMPTZ | Record creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Constraints:**
- `chk_week_number`: Week must be 1-53
- `chk_year`: Year must be 2020-2100
- `chk_capacity_value`: Capacity must be 1-100
- `uq_associate_week_year`: Unique (associate_id, week_number, year)

**Indexes:**
- `idx_capacities_associate_id` on `associate_id`
- `idx_capacities_week_year` on `(week_number, year)`
- `idx_capacities_associate_week_year` on `(associate_id, week_number, year)`

**Important**: Capacity changes NEVER modify historical weeks. This preserves historical accuracy.

---

#### 4. projects
All projects in the system.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Primary key |
| project_id | TEXT | Business project ID (unique) |
| project_name | TEXT | Project name |
| client | TEXT | Client name |
| project_date | DATE | Project date |
| week_number | INTEGER | Auto-calculated week number |
| year | INTEGER | Auto-calculated year |
| priority | project_priority | Priority (low/medium/high/urgent) |
| status | project_status | Status (pending/assigned/in_progress/completed/cancelled/on_hold) |
| comments | TEXT | Optional comments |
| assigned_associate_id | UUID (FK) | Assigned associate |
| assigned_associate_name | TEXT | Associate name (denormalized for performance) |
| completion_date | TIMESTAMPTZ | Date when completed |
| source | project_source | Source (manual/opening_balance/api/import) |
| created_by | UUID (FK) | User who created the project |
| created_at | TIMESTAMPTZ | Record creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Enums:**
- `project_status`: pending, assigned, in_progress, completed, cancelled, on_hold
- `project_priority`: low, medium, high, urgent
- `project_source`: manual, opening_balance, api, import

**Indexes:**
- `idx_projects_project_id` on `project_id`
- `idx_projects_status` on `status`
- `idx_projects_assigned_associate` on `assigned_associate_id`
- `idx_projects_week_year` on `(week_number, year)`
- `idx_projects_project_date` on `project_date`
- `idx_projects_client` on `client`
- `idx_projects_priority` on `priority`
- `idx_projects_name_fts` full-text search on `project_name`
- `idx_projects_client_fts` full-text search on `client`
- `idx_projects_status_week_year` composite on `(status, week_number, year)`

**Triggers:**
- `calculate_projects_week_year`: Auto-calculates week_number and year from project_date

---

#### 5. assignments
Assignment history linking projects to associates.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Primary key |
| project_id | UUID (FK) | References projects(id) |
| associate_id | UUID (FK) | References associates(id) |
| assigned_by | UUID (FK) | User who made the assignment |
| assigned_at | TIMESTAMPTZ | Assignment timestamp |
| recommended_associate_id | UUID (FK) | Who was recommended |
| override_reason | TEXT | Reason if recommendation was overridden |
| is_override | BOOLEAN | Was recommendation overridden? |

**Constraints:**
- `uq_project_assignment`: One assignment per project

**Indexes:**
- `idx_assignments_project_id` on `project_id`
- `idx_assignments_associate_id` on `associate_id`
- `idx_assignments_assigned_by` on `assigned_by`
- `idx_assignments_assigned_at` on `assigned_at`
- `idx_assignments_is_override` on `is_override`

---

#### 6. recommendations
History of recommendation engine outputs.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Primary key |
| project_id | UUID (FK) | References projects(id) |
| recommended_associate_id | UUID (FK) | Recommended associate |
| recommended_associate_name | TEXT | Associate name |
| workload_before | INTEGER | Workload before assignment |
| workload_after | INTEGER | Workload after assignment |
| explanation | TEXT | Human-readable explanation |
| was_accepted | BOOLEAN | Was recommendation accepted? |
| actual_assigned_associate_id | UUID (FK) | Who was actually assigned |
| created_at | TIMESTAMPTZ | Recommendation timestamp |

**Indexes:**
- `idx_recommendations_project_id` on `project_id`
- `idx_recommendations_associate_id` on `recommended_associate_id`
- `idx_recommendations_was_accepted` on `was_accepted`
- `idx_recommendations_created_at` on `created_at`

---

### Opening Balance Tables

#### 7. opening_balance
Historical projects imported at system initialization.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Primary key |
| project_id | TEXT | Business project ID |
| project_name | TEXT | Project name |
| client | TEXT | Client name |
| project_date | DATE | Project date |
| week_number | INTEGER | Auto-calculated week number |
| year | INTEGER | Auto-calculated year |
| assigned_associate_id | UUID (FK) | Assigned associate |
| imported_by | UUID (FK) | User who imported |
| imported_at | TIMESTAMPTZ | Import timestamp |
| import_batch_id | UUID | Batch identifier |

**Constraints:**
- `uq_opening_balance_project`: Unique (project_id, import_batch_id)

**Indexes:**
- `idx_opening_balance_associate_id` on `assigned_associate_id`
- `idx_opening_balance_batch_id` on `import_batch_id`
- `idx_opening_balance_imported_by` on `imported_by`
- `idx_opening_balance_week_year` on `(week_number, year)`

**Triggers:**
- `calculate_opening_balance_week_year`: Auto-calculates week_number and year

---

#### 8. opening_balance_import_logs
Logs of opening balance import operations.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Primary key |
| batch_id | UUID | Batch identifier (unique) |
| total_records | INTEGER | Total records in import |
| successful_imports | INTEGER | Successfully imported records |
| failed_imports | INTEGER | Failed records |
| errors | JSONB | Error details |
| imported_by | UUID (FK) | User who imported |
| imported_at | TIMESTAMPTZ | Import timestamp |

**Constraints:**
- `chk_import_counts`: Validates count integrity

**Indexes:**
- `idx_import_logs_batch_id` on `batch_id`
- `idx_import_logs_imported_by` on `imported_by`
- `idx_import_logs_imported_at` on `imported_at`

---

### System Tables

#### 9. audit_logs
Comprehensive audit trail of all system actions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Primary key |
| user_id | UUID (FK) | User who performed action |
| user_email | TEXT | User email |
| action | audit_action | Action type |
| entity_type | TEXT | Type of entity affected |
| entity_id | UUID | ID of entity affected |
| old_value | JSONB | Previous values |
| new_value | JSONB | New values |
| metadata | JSONB | Additional metadata |
| ip_address | TEXT | IP address (optional) |
| created_at | TIMESTAMPTZ | Action timestamp |

**Enum: audit_action**
- login, logout
- create_associate, update_associate, delete_associate, disable_associate, enable_associate
- create_project, update_project, assign_project, complete_project, cancel_project
- update_capacity
- import_opening_balance, delete_import
- update_settings
- override_recommendation

**Indexes:**
- `idx_audit_logs_user_id` on `user_id`
- `idx_audit_logs_action` on `action`
- `idx_audit_logs_entity_type` on `entity_type`
- `idx_audit_logs_entity_id` on `entity_id`
- `idx_audit_logs_created_at` on `created_at`
- `idx_audit_logs_user_action_date` composite on `(user_id, action, created_at)`

---

#### 10. settings
Global system settings (singleton table).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Primary key |
| organization_name | TEXT | Organization name |
| week_start_day | INTEGER | Week start (0=Sunday, 1=Monday, etc.) |
| default_weekly_capacity | INTEGER | Default capacity for new associates |
| enable_ai_recommendations | BOOLEAN | Future: Enable AI recommendations |
| enable_email_notifications | BOOLEAN | Future: Enable email notifications |
| theme | TEXT | UI theme (light/dark/system) |
| created_at | TIMESTAMPTZ | Record creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Constraints:**
- `chk_week_start_day`: Must be 0-6
- `chk_default_capacity`: Must be 1-100
- `chk_theme`: Must be 'light', 'dark', or 'system'
- `idx_settings_singleton`: Ensures only one row exists

---

## Database Functions

### 1. get_associate_workload(associate_id, week_number, year)
Calculate total active workload for an associate in a specific week.

**Returns**: INTEGER

**Logic**:
- Counts projects with status NOT IN ('completed', 'cancelled')
- Adds opening balance projects for the same week
- Returns total count

**Usage**:
```sql
SELECT get_associate_workload('associate-uuid', 25, 2024);
```

---

### 2. get_associate_capacity(associate_id, week_number, year)
Get capacity for an associate in a specific week.

**Returns**: INTEGER

**Logic**:
- First checks `capacities` table for week-specific override
- Falls back to associate's default `weekly_capacity`
- Returns 0 if associate not found

**Usage**:
```sql
SELECT get_associate_capacity('associate-uuid', 25, 2024);
```

---

### 3. has_capacity(associate_id, week_number, year)
Check if associate has available capacity in a specific week.

**Returns**: BOOLEAN

**Logic**:
- Gets current workload
- Gets capacity for the week
- Returns TRUE if workload < capacity

**Usage**:
```sql
SELECT has_capacity('associate-uuid', 25, 2024);
```

---

### 4. get_oldest_project_date(associate_id)
Get the oldest active project date for an associate.

**Returns**: DATE

**Logic**:
- Finds minimum project_date from active projects
- Checks both `projects` and `opening_balance`
- Returns earliest date found

**Usage**:
```sql
SELECT get_oldest_project_date('associate-uuid');
```

---

## Views

### v_associates_with_workload
Materialized view showing associates with real-time workload calculations.

**Columns**:
- All columns from `associates`
- `current_workload`: Total active projects
- `available_capacity`: Remaining capacity
- `utilization_percentage`: Percentage of capacity used

**Usage**:
```sql
SELECT * FROM v_associates_with_workload
WHERE is_active = TRUE
ORDER BY current_workload ASC;
```

---

## Row-Level Security (RLS)

All tables have RLS enabled with policies based on user roles.

### Policy Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| users | Self + Managers | - | Self | - |
| associates | All authenticated | Managers | Managers | Managers |
| capacities | All authenticated | Managers | Managers | Managers |
| projects | All authenticated | Managers | Managers | Managers |
| assignments | All authenticated | Managers | Managers | - |
| recommendations | All authenticated | Managers | Managers | - |
| opening_balance | All authenticated | Managers | - | Managers |
| import_logs | All authenticated | Managers | - | - |
| audit_logs | Self + Managers | All authenticated | - | - |
| settings | All authenticated | Managers | Managers | - |

### Helper Functions for RLS

**is_manager()**
Returns TRUE if current user has 'manager' role.

**is_authenticated()**
Returns TRUE if user is authenticated.

---

## Triggers

### Auto-Update Triggers

**update_updated_at_column()**
Automatically updates `updated_at` timestamp on row modification.

Applied to:
- users
- associates
- capacities
- projects
- settings

### Business Logic Triggers

**calculate_week_year()**
Automatically calculates `week_number` and `year` from `project_date`.

Applied to:
- projects (on INSERT or UPDATE of project_date)
- opening_balance (on INSERT or UPDATE of project_date)

---

## Indexes Strategy

### 1. Primary Keys
All tables use UUID primary keys for global uniqueness and scalability.

### 2. Foreign Keys
All foreign key columns are indexed for join performance.

### 3. Frequently Queried Columns
Indexes on:
- Status fields (is_active, is_available, status)
- Date/time fields (created_at, project_date)
- Composite indexes for common queries

### 4. Full-Text Search
GIN indexes on:
- associate.name
- projects.project_name
- projects.client

### 5. Unique Constraints
Enforce data integrity:
- employee_id (associates)
- email (associates, users)
- project_id (projects)
- (associate_id, week_number, year) (capacities)

---

## Recommendation Engine Integration

The database is designed to support the 11-step recommendation algorithm:

1. **Step 3**: `has_capacity()` checks capacity eligibility
2. **Step 4**: `get_associate_workload()` calculates active workload
3. **Step 6**: `get_oldest_project_date()` for FIFO tie-breaking
4. **Step 8**: Stores explanation in `recommendations` table
5. **Step 10**: Uses database transactions for atomic assignment
6. **Step 11**: Updates multiple tables in a single transaction

---

## Data Integrity Rules

### Capacity Management
- Capacity changes create NEW rows in `capacities` table
- Historical capacity is NEVER modified
- Default capacity comes from `associates.weekly_capacity`
- Week-specific overrides come from `capacities` table

### Workload Calculation
- Active workload = projects with status NOT IN ('completed', 'cancelled')
- Opening balance projects ALWAYS count toward workload
- Workload is calculated per week

### Assignment Rules
- One project can have only ONE assignment
- Assignment creates entries in:
  - `projects` (assigned_associate_id, assigned_associate_name, status)
  - `assignments` (full assignment details)
  - `recommendations` (recommendation outcome)
  - `audit_logs` (audit trail)

---

## Performance Considerations

### Expected Load
- 10,000+ associates
- 1,000,000+ projects
- 100 concurrent users

### Optimization Strategies
1. **Strategic Indexing**: Covers all frequent queries
2. **Denormalization**: `assigned_associate_name` in projects for performance
3. **View Caching**: `v_associates_with_workload` can be materialized
4. **Partitioning**: Future: Partition projects by year
5. **Connection Pooling**: Supabase handles this automatically

### Query Performance Targets
- Dashboard load: < 2 seconds
- Recommendation calculation: < 500ms
- Search: < 300ms
- Bulk assignment (1000 projects): < 30 seconds

---

## Migration Strategy

### Initial Setup
1. Run `20240101000000_initial_schema.sql`
2. Run `20240101000001_rls_policies.sql`

### Future Migrations
All schema changes should:
- Use timestamped migration files
- Be backwards compatible where possible
- Include rollback procedures
- Update this documentation

---

## Backup and Recovery

### Backup Strategy
- Supabase provides automatic daily backups
- Point-in-time recovery available
- Export critical data regularly:
  - associates
  - projects
  - assignments
  - audit_logs

### Critical Data
Never lose:
- Assignment history (`assignments` table)
- Recommendation history (`recommendations` table)
- Audit logs (`audit_logs` table)

---

## Future Enhancements

### Planned Features (Out of scope for V1)
1. **Multi-tenancy**: Add `organization_id` to all tables
2. **Skills Matching**: Use `associates.skills` array
3. **AI Recommendations**: Use `enable_ai_recommendations` setting
4. **Notifications**: Use `enable_email_notifications` setting
5. **Leave Management**: New `leaves` table
6. **Departments**: Expand `associates.department` with department table
7. **Roles**: Add `roles` and `permissions` tables
8. **API Integrations**: New `api_configurations` table

### Schema Extensions Ready
The schema is designed to support these features without major redesign.

---

## Maintenance

### Regular Tasks
1. **Vacuum**: PostgreSQL auto-vacuum is enabled
2. **Analyze**: Run ANALYZE on large tables monthly
3. **Reindex**: Reindex if query performance degrades
4. **Audit Log Archival**: Archive old audit logs (> 2 years)

### Monitoring
Monitor:
- Table sizes
- Index usage (`pg_stat_user_indexes`)
- Query performance (`pg_stat_statements`)
- Connection pool usage
- RLS policy performance

---

## Support and Documentation

### Schema Version
**Version**: 1.0.0  
**Last Updated**: 2024-01-01

### Contact
For schema questions or issues, contact the development team.

---

## Appendix: Quick Reference

### Get Associate Workload
```sql
SELECT 
  a.name,
  get_associate_workload(a.id, 25, 2024) as workload,
  get_associate_capacity(a.id, 25, 2024) as capacity
FROM associates a
WHERE a.is_active = TRUE;
```

### Find Available Associates for a Week
```sql
SELECT a.*
FROM associates a
WHERE a.is_active = TRUE
  AND a.is_available = TRUE
  AND has_capacity(a.id, 25, 2024) = TRUE
ORDER BY get_associate_workload(a.id, 25, 2024) ASC;
```

### Get Utilization Report
```sql
SELECT * FROM v_associates_with_workload
WHERE is_active = TRUE
ORDER BY utilization_percentage DESC;
```

### Find Overrides
```sql
SELECT 
  p.project_name,
  r.recommended_associate_name,
  a.name as actual_assigned,
  asg.override_reason
FROM assignments asg
JOIN projects p ON p.id = asg.project_id
JOIN associates a ON a.id = asg.associate_id
LEFT JOIN recommendations r ON r.project_id = asg.project_id
WHERE asg.is_override = TRUE
ORDER BY asg.assigned_at DESC;
```

---

**End of Database Schema Documentation**
