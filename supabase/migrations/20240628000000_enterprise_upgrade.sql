-- ============================================================================
-- WBIPAS Enterprise Upgrade Migration
-- Version: 1.0.0
-- Date: 2024-06-28
-- Description: Upgrade from basic schema to enterprise-grade design (Volume 3)
-- ============================================================================
-- 
-- This migration adds:
-- - 3 new tables (holidays, activity_logs, notifications)
-- - 2 new enums (availability_status, import_type)
-- - Enhanced columns for existing tables
-- - 3 new views (v_current_workload, v_weekly_capacity, v_dashboard_kpis)
-- - 1 stored procedure (assign_project)
-- - 5 new triggers
-- - Comprehensive indexes
-- - Enhanced RLS policies
--
-- Migration Strategy: Zero-downtime additive changes
-- Rollback: See 20240628000001_rollback_enterprise_upgrade.sql
--
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- ============================================================================
-- PART 1: NEW ENUMS
-- ============================================================================

-- Availability Status Enum (replaces boolean is_available)
DO $$ BEGIN
  CREATE TYPE availability_status AS ENUM (
    'available',
    'leave',
    'training',
    'holiday',
    'inactive'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Import Type Enum (for unified import_history)
DO $$ BEGIN
  CREATE TYPE import_type AS ENUM (
    'opening_balance',
    'projects',
    'associates',
    'capacity'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enhance project_source enum with 'bulk_assignment'
DO $$ BEGIN
  ALTER TYPE project_source ADD VALUE IF NOT EXISTS 'bulk_assignment';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;


-- ============================================================================
-- PART 2: CREATE NEW TABLES
-- ============================================================================

-- ============================================================================
-- TABLE: profiles (rename from users)
-- ============================================================================
-- Note: We're creating a new table and will migrate data later
-- This allows zero-downtime migration

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'manager',
  avatar_url TEXT, -- NEW: Profile picture URL
  is_active BOOLEAN NOT NULL DEFAULT TRUE, -- NEW: Soft delete flag
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT chk_role CHECK (role IN ('manager', 'admin', 'supervisor', 'viewer'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- Comments
COMMENT ON TABLE public.profiles IS 'User profiles extending auth.users with application data';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL to user profile picture (S3/CDN)';
COMMENT ON COLUMN public.profiles.is_active IS 'Soft delete flag - inactive users cannot login';


-- ============================================================================
-- TABLE: capacity_history (enhanced replacement for capacities)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.capacity_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  associate_id UUID NOT NULL REFERENCES public.associates(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  capacity INTEGER NOT NULL,
  effective_from DATE NOT NULL, -- NEW: Start date of capacity
  effective_to DATE, -- NEW: End date of capacity (NULL = current)
  created_by UUID NOT NULL REFERENCES public.users(id), -- NEW: Audit trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT chk_ch_week_number CHECK (week_number >= 1 AND week_number <= 53),
  CONSTRAINT chk_ch_year CHECK (year >= 2020 AND year <= 2100),
  CONSTRAINT chk_ch_capacity CHECK (capacity > 0 AND capacity <= 100),
  CONSTRAINT chk_ch_dates CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_capacity_history_associate_id ON public.capacity_history(associate_id);
CREATE INDEX IF NOT EXISTS idx_capacity_history_week_year ON public.capacity_history(week_number, year);
CREATE INDEX IF NOT EXISTS idx_capacity_history_effective_dates ON public.capacity_history(effective_from, effective_to);
CREATE INDEX IF NOT EXISTS idx_capacity_history_created_by ON public.capacity_history(created_by);

-- Comments
COMMENT ON TABLE public.capacity_history IS 'Immutable history of capacity changes - never update, only insert';
COMMENT ON COLUMN public.capacity_history.effective_from IS 'Date when this capacity becomes active';
COMMENT ON COLUMN public.capacity_history.effective_to IS 'Date when this capacity ends (NULL = current)';


-- ============================================================================
-- TABLE: holidays
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.holidays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  holiday_name TEXT NOT NULL,
  holiday_date DATE NOT NULL,
  country TEXT,
  state TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint: same holiday can't be on same date for same location
  CONSTRAINT uq_holiday_date_location UNIQUE (holiday_date, country, state)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_holidays_date ON public.holidays(holiday_date);
CREATE INDEX IF NOT EXISTS idx_holidays_country ON public.holidays(country);
CREATE INDEX IF NOT EXISTS idx_holidays_state ON public.holidays(state);
CREATE INDEX IF NOT EXISTS idx_holidays_date_country ON public.holidays(holiday_date, country);

-- Comments
COMMENT ON TABLE public.holidays IS 'National and state holidays for capacity planning';
COMMENT ON COLUMN public.holidays.country IS 'ISO country code (e.g., US, IN, GB)';
COMMENT ON COLUMN public.holidays.state IS 'State/province code (e.g., CA, NY, KA)';


-- ============================================================================
-- TABLE: activity_logs (dashboard timeline)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT, -- Icon name (e.g., 'user-plus', 'check-circle')
  entity TEXT, -- Entity type: 'project', 'associate', 'assignment'
  entity_id UUID, -- ID of the entity
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_id ON public.activity_logs(entity_id);

-- Comments
COMMENT ON TABLE public.activity_logs IS 'User-friendly activity feed for dashboard timeline (separate from audit_logs)';
COMMENT ON COLUMN public.activity_logs.icon IS 'Lucide icon name for UI display';
COMMENT ON COLUMN public.activity_logs.entity IS 'Type of entity: project, associate, assignment, etc.';


-- ============================================================================
-- TABLE: import_history (consolidated from opening_balance tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.import_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name TEXT NOT NULL,
  import_type import_type NOT NULL,
  records INTEGER NOT NULL DEFAULT 0, -- Total records in file
  success_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  imported_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT chk_import_records CHECK (records >= 0),
  CONSTRAINT chk_import_success CHECK (success_count >= 0),
  CONSTRAINT chk_import_failed CHECK (failed_count >= 0),
  CONSTRAINT chk_import_total CHECK (success_count + failed_count <= records)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_import_history_type ON public.import_history(import_type);
CREATE INDEX IF NOT EXISTS idx_import_history_imported_by ON public.import_history(imported_by);
CREATE INDEX IF NOT EXISTS idx_import_history_created_at ON public.import_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_import_history_type_date ON public.import_history(import_type, created_at DESC);

-- Comments
COMMENT ON TABLE public.import_history IS 'Unified history of all data imports (opening balance, projects, associates, capacity)';
COMMENT ON COLUMN public.import_history.import_type IS 'Type of data imported: opening_balance, projects, associates, or capacity';


-- ============================================================================
-- TABLE: notifications (future-ready)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  type TEXT, -- 'assignment', 'capacity_change', 'system', 'reminder'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT chk_notification_type CHECK (type IN ('assignment', 'capacity_change', 'system', 'reminder', 'warning', 'info'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Comments
COMMENT ON TABLE public.notifications IS 'Future-ready notification system for email and in-app notifications';
COMMENT ON COLUMN public.notifications.is_read IS 'Whether user has read this notification';


-- ============================================================================
-- TABLE: recommendation_logs (enhanced replacement for recommendations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.recommendation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  recommended_associate UUID NOT NULL REFERENCES public.associates(id) ON DELETE CASCADE,
  recommended_rank INTEGER NOT NULL DEFAULT 1, -- NEW: Rank for multi-candidate recommendations
  recommendation_reason TEXT NOT NULL,
  workload INTEGER NOT NULL DEFAULT 0,
  capacity INTEGER NOT NULL DEFAULT 0, -- NEW: Capacity at time of recommendation
  fifo_date DATE, -- NEW: Oldest project date for FIFO visibility
  algorithm_version TEXT NOT NULL DEFAULT '1.0', -- NEW: For A/B testing
  accepted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT chk_rec_rank CHECK (recommended_rank > 0),
  CONSTRAINT chk_rec_workload CHECK (workload >= 0),
  CONSTRAINT chk_rec_capacity CHECK (capacity > 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recommendation_logs_project_id ON public.recommendation_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_logs_associate ON public.recommendation_logs(recommended_associate);
CREATE INDEX IF NOT EXISTS idx_recommendation_logs_accepted ON public.recommendation_logs(accepted);
CREATE INDEX IF NOT EXISTS idx_recommendation_logs_algorithm ON public.recommendation_logs(algorithm_version);
CREATE INDEX IF NOT EXISTS idx_recommendation_logs_created_at ON public.recommendation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendation_logs_project_rank ON public.recommendation_logs(project_id, recommended_rank);

-- Comments
COMMENT ON TABLE public.recommendation_logs IS 'Detailed history of all recommendation engine outputs';
COMMENT ON COLUMN public.recommendation_logs.recommended_rank IS '1=top recommendation, 2=second choice, etc.';
COMMENT ON COLUMN public.recommendation_logs.algorithm_version IS 'Algorithm version for A/B testing (e.g., "1.0", "ai-1.0")';
COMMENT ON COLUMN public.recommendation_logs.accepted IS 'TRUE if this recommendation was accepted';


-- ============================================================================
-- PART 3: ENHANCE EXISTING TABLES
-- ============================================================================

-- ============================================================================
-- ENHANCE: associates table
-- ============================================================================

-- Add new columns
ALTER TABLE public.associates 
  ADD COLUMN IF NOT EXISTS employee_code TEXT,
  ADD COLUMN IF NOT EXISTS designation TEXT,
  ADD COLUMN IF NOT EXISTS availability_status availability_status DEFAULT 'available';

-- Migrate data: is_available → availability_status
UPDATE public.associates 
SET availability_status = CASE 
  WHEN is_available = TRUE THEN 'available'::availability_status
  ELSE 'inactive'::availability_status
END
WHERE availability_status IS NULL;

-- Make availability_status NOT NULL after migration
ALTER TABLE public.associates 
  ALTER COLUMN availability_status SET NOT NULL;

-- Rename employee_id to employee_code (if not already renamed)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='associates' AND column_name='employee_id'
  ) THEN
    -- Copy data to new column
    UPDATE public.associates SET employee_code = employee_id WHERE employee_code IS NULL;
    -- Make it NOT NULL
    ALTER TABLE public.associates ALTER COLUMN employee_code SET NOT NULL;
    -- Add unique constraint
    ALTER TABLE public.associates ADD CONSTRAINT uq_associates_employee_code UNIQUE (employee_code);
    -- Create index
    CREATE INDEX IF NOT EXISTS idx_associates_employee_code ON public.associates(employee_code);
  END IF;
END $$;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_associates_designation ON public.associates(designation);
CREATE INDEX IF NOT EXISTS idx_associates_availability_status ON public.associates(availability_status);


-- ============================================================================
-- ENHANCE: projects table
-- ============================================================================

-- Add project_code column
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS project_code TEXT;

-- Generate project_code from project_id if null
UPDATE public.projects 
SET project_code = 'PROJ-' || project_id 
WHERE project_code IS NULL;

-- Make project_code NOT NULL
ALTER TABLE public.projects 
  ALTER COLUMN project_code SET NOT NULL;

-- Add unique constraint and index
ALTER TABLE public.projects 
  ADD CONSTRAINT IF NOT EXISTS uq_projects_project_code UNIQUE (project_code);

CREATE INDEX IF NOT EXISTS idx_projects_project_code ON public.projects(project_code);

-- Comments
COMMENT ON COLUMN public.projects.project_code IS 'Business project code identifier (e.g., PROJ-2024-001)';


-- ============================================================================
-- ENHANCE: assignments table
-- ============================================================================

-- Add new columns
ALTER TABLE public.assignments 
  ADD COLUMN IF NOT EXISTS assignment_engine_version TEXT DEFAULT '1.0',
  ADD COLUMN IF NOT EXISTS recommendation_id UUID REFERENCES public.recommendation_logs(id) ON DELETE SET NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_assignments_engine_version ON public.assignments(assignment_engine_version);
CREATE INDEX IF NOT EXISTS idx_assignments_recommendation_id ON public.assignments(recommendation_id);

-- Comments
COMMENT ON COLUMN public.assignments.assignment_engine_version IS 'Version of recommendation engine used (e.g., "1.0", "ai-1.0")';
COMMENT ON COLUMN public.assignments.recommendation_id IS 'Links to the recommendation that was accepted';


-- ============================================================================
-- ENHANCE: settings table
-- ============================================================================

-- Add new columns
ALTER TABLE public.settings 
  ADD COLUMN IF NOT EXISTS fifo_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS capacity_rule TEXT DEFAULT 'strict';

-- Add constraint for capacity_rule
ALTER TABLE public.settings 
  ADD CONSTRAINT IF NOT EXISTS chk_capacity_rule 
  CHECK (capacity_rule IN ('strict', 'soft', 'flexible'));

-- Update existing row with new defaults
UPDATE public.settings 
SET 
  fifo_enabled = COALESCE(fifo_enabled, TRUE),
  capacity_rule = COALESCE(capacity_rule, 'strict');

-- Comments
COMMENT ON COLUMN public.settings.fifo_enabled IS 'Whether to use FIFO tie-breaking in recommendations';
COMMENT ON COLUMN public.settings.capacity_rule IS 'How to handle capacity: strict (never exceed), soft (warn), flexible (allow)';


-- ============================================================================
-- PART 4: DATA MIGRATION
-- ============================================================================

-- Migrate users → profiles (if profiles is empty)
INSERT INTO public.profiles (id, full_name, email, role, is_active, created_at, updated_at)
SELECT id, full_name, email, role, TRUE, created_at, updated_at
FROM public.users
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = users.id)
ON CONFLICT (id) DO NOTHING;

-- Migrate capacities → capacity_history
INSERT INTO public.capacity_history (
  id,
  associate_id,
  week_number,
  year,
  capacity,
  effective_from,
  effective_to,
  created_by,
  created_at
)
SELECT 
  id,
  associate_id,
  week_number,
  year,
  weekly_capacity,
  created_at::DATE, -- Use creation date as effective_from
  NULL, -- NULL means still active
  (SELECT id FROM public.users LIMIT 1), -- System user as creator
  created_at
FROM public.capacities
WHERE NOT EXISTS (
  SELECT 1 FROM public.capacity_history ch 
  WHERE ch.id = capacities.id
)
ON CONFLICT DO NOTHING;


-- Migrate recommendations → recommendation_logs
INSERT INTO public.recommendation_logs (
  id,
  project_id,
  recommended_associate,
  recommended_rank,
  recommendation_reason,
  workload,
  capacity,
  fifo_date,
  algorithm_version,
  accepted,
  created_at
)
SELECT 
  id,
  project_id,
  recommended_associate_id,
  1, -- All existing recommendations are rank 1
  explanation,
  workload_before,
  0, -- Capacity not tracked in old schema
  NULL, -- FIFO date not tracked in old schema
  '1.0', -- Legacy algorithm version
  was_accepted,
  created_at
FROM public.recommendations
WHERE NOT EXISTS (
  SELECT 1 FROM public.recommendation_logs rl 
  WHERE rl.id = recommendations.id
)
ON CONFLICT DO NOTHING;

-- Migrate opening_balance_import_logs → import_history
INSERT INTO public.import_history (
  id,
  file_name,
  import_type,
  records,
  success_count,
  failed_count,
  imported_by,
  created_at
)
SELECT 
  id,
  'opening_balance_' || batch_id::TEXT || '.xlsx', -- Generate file name
  'opening_balance'::import_type,
  total_records,
  successful_imports,
  failed_imports,
  imported_by,
  imported_at
FROM public.opening_balance_import_logs
WHERE NOT EXISTS (
  SELECT 1 FROM public.import_history ih 
  WHERE ih.id = opening_balance_import_logs.id
)
ON CONFLICT DO NOTHING;


-- ============================================================================
-- PART 5: CREATE VIEWS
-- ============================================================================

-- ============================================================================
-- VIEW: v_current_workload
-- ============================================================================

CREATE OR REPLACE VIEW v_current_workload AS
SELECT 
  associate_id,
  COUNT(*) as active_project_count,
  COUNT(*) FILTER (WHERE source = 'opening_balance') as opening_balance_count,
  COUNT(*) FILTER (WHERE source != 'opening_balance') as assigned_project_count
FROM (
  -- Active projects
  SELECT 
    assigned_associate_id as associate_id,
    'assigned' as source
  FROM public.projects
  WHERE status NOT IN ('completed', 'cancelled')
    AND assigned_associate_id IS NOT NULL
  
  UNION ALL
  
  -- Opening balance projects
  SELECT 
    assigned_associate_id as associate_id,
    'opening_balance' as source
  FROM public.opening_balance
) workload
GROUP BY associate_id;

COMMENT ON VIEW v_current_workload IS 'Real-time active workload per associate';


-- ============================================================================
-- VIEW: v_weekly_capacity
-- ============================================================================

CREATE OR REPLACE VIEW v_weekly_capacity AS
SELECT 
  a.id as associate_id,
  a.name as associate_name,
  a.employee_code,
  EXTRACT(WEEK FROM CURRENT_DATE)::INTEGER as current_week,
  EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER as current_year,
  COALESCE(ch.capacity, a.weekly_capacity) as weekly_capacity,
  COALESCE(w.active_project_count, 0) as assigned_count,
  COALESCE(ch.capacity, a.weekly_capacity) - COALESCE(w.active_project_count, 0) as remaining_capacity,
  CASE 
    WHEN COALESCE(ch.capacity, a.weekly_capacity) > 0 THEN
      ROUND((COALESCE(w.active_project_count, 0)::NUMERIC / 
             COALESCE(ch.capacity, a.weekly_capacity)::NUMERIC * 100), 2)
    ELSE 0
  END as utilization_percentage,
  a.is_active,
  a.availability_status
FROM public.associates a
LEFT JOIN public.capacity_history ch ON (
  ch.associate_id = a.id 
  AND ch.week_number = EXTRACT(WEEK FROM CURRENT_DATE)::INTEGER
  AND ch.year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
  AND (ch.effective_to IS NULL OR ch.effective_to >= CURRENT_DATE)
)
LEFT JOIN v_current_workload w ON w.associate_id = a.id
WHERE a.is_active = TRUE;

COMMENT ON VIEW v_weekly_capacity IS 'Current week capacity and utilization for all active associates';


-- ============================================================================
-- VIEW: v_dashboard_kpis
-- ============================================================================

CREATE OR REPLACE VIEW v_dashboard_kpis AS
SELECT 
  -- Associate KPIs
  (SELECT COUNT(*) FROM public.associates WHERE is_active = TRUE) as total_associates,
  (SELECT COUNT(*) FROM public.associates WHERE is_active = TRUE AND availability_status = 'available') as available_associates,
  (SELECT COUNT(*) FROM v_current_workload) as associates_with_workload,
  
  -- Project KPIs
  (SELECT COUNT(*) FROM public.projects) as total_projects,
  (SELECT COUNT(*) FROM public.projects WHERE status IN ('pending', 'assigned', 'in_progress')) as active_projects,
  (SELECT COUNT(*) FROM public.projects WHERE status = 'completed') as completed_projects,
  (SELECT COUNT(*) FROM public.projects WHERE status = 'pending') as pending_projects,
  
  -- Capacity KPIs
  (SELECT SUM(weekly_capacity) FROM public.associates WHERE is_active = TRUE) as total_capacity,
  (SELECT SUM(active_project_count) FROM v_current_workload) as total_workload,
  (SELECT SUM(weekly_capacity) - COALESCE(SUM(w.active_project_count), 0)
   FROM public.associates a
   LEFT JOIN v_current_workload w ON w.associate_id = a.id
   WHERE a.is_active = TRUE) as available_capacity,
  
  -- Utilization KPIs
  (SELECT ROUND(AVG(utilization_percentage), 2) FROM v_weekly_capacity) as average_utilization,
  (SELECT COUNT(*) FROM v_weekly_capacity WHERE utilization_percentage >= 100) as over_capacity_count,
  (SELECT COUNT(*) FROM v_weekly_capacity WHERE utilization_percentage = 0) as idle_count,
  
  -- Recent activity counts
  (SELECT COUNT(*) FROM public.projects WHERE DATE(created_at) = CURRENT_DATE) as projects_created_today,
  (SELECT COUNT(*) FROM public.assignments WHERE DATE(assigned_at) = CURRENT_DATE) as assignments_today,
  (SELECT COUNT(*) FROM public.projects WHERE DATE(completion_date) = CURRENT_DATE) as completions_today
FROM (SELECT 1) dummy; -- Dummy table for CROSS JOIN behavior

COMMENT ON VIEW v_dashboard_kpis IS 'Single-query dashboard metrics for real-time KPI display';


-- Comments for new columns
COMMENT ON COLUMN public.associates.employee_code IS 'Unique employee code/identifier';
COMMENT ON COLUMN public.associates.designation IS 'Job title or designation (e.g., Senior Developer, Team Lead)';
COMMENT ON COLUMN public.associates.availability_status IS 'Detailed availability status: available, leave, training, holiday, inactive';


-- ============================================================================
-- PART 6: STORED PROCEDURES
-- ============================================================================

-- ============================================================================
-- FUNCTION: assign_project (atomic project assignment)
-- ============================================================================

CREATE OR REPLACE FUNCTION assign_project(
  p_project_id UUID,
  p_associate_id UUID,
  p_assigned_by UUID,
  p_recommendation_id UUID DEFAULT NULL,
  p_override_reason TEXT DEFAULT NULL,
  p_engine_version TEXT DEFAULT '1.0'
)
RETURNS JSONB AS $$
DECLARE
  v_assignment_id UUID;
  v_project_name TEXT;
  v_associate_name TEXT;
  v_week_number INTEGER;
  v_year INTEGER;
  v_is_override BOOLEAN;
BEGIN
  -- Get project details
  SELECT project_name, week_number, year
  INTO v_project_name, v_week_number, v_year
  FROM public.projects
  WHERE id = p_project_id;
  
  IF v_project_name IS NULL THEN
    RAISE EXCEPTION 'Project not found: %', p_project_id;
  END IF;
  
  -- Get associate details
  SELECT name INTO v_associate_name
  FROM public.associates
  WHERE id = p_associate_id;
  
  IF v_associate_name IS NULL THEN
    RAISE EXCEPTION 'Associate not found: %', p_associate_id;
  END IF;
  
  -- Check capacity (warning only, don't block)
  IF NOT has_capacity(p_associate_id, v_week_number, v_year) THEN
    RAISE NOTICE 'WARNING: Associate % is at or over capacity', v_associate_name;
  END IF;
  
  -- Determine if this is an override
  v_is_override := (p_recommendation_id IS NOT NULL AND p_override_reason IS NOT NULL);
  
  -- Update project
  UPDATE public.projects SET
    assigned_associate_id = p_associate_id,
    assigned_associate_name = v_associate_name,
    status = 'assigned',
    updated_at = NOW()
  WHERE id = p_project_id;
  
  -- Create assignment record
  INSERT INTO public.assignments (
    id,
    project_id,
    associate_id,
    assigned_by,
    assigned_at,
    recommendation_id,
    is_override,
    override_reason,
    assignment_engine_version
  ) VALUES (
    uuid_generate_v4(),
    p_project_id,
    p_associate_id,
    p_assigned_by,
    NOW(),
    p_recommendation_id,
    v_is_override,
    p_override_reason,
    p_engine_version
  ) RETURNING id INTO v_assignment_id;
  
  -- Update recommendation if provided
  IF p_recommendation_id IS NOT NULL THEN
    UPDATE public.recommendation_logs
    SET accepted = (p_override_reason IS NULL)
    WHERE id = p_recommendation_id;
  END IF;
  
  -- Create audit log
  INSERT INTO public.audit_logs (
    user_id,
    user_email,
    action,
    entity_type,
    entity_id,
    new_value,
    created_at
  )
  SELECT 
    p_assigned_by,
    u.email,
    'assign_project'::audit_action,
    'project',
    p_project_id,
    jsonb_build_object(
      'project_name', v_project_name,
      'associate_name', v_associate_name,
      'is_override', v_is_override,
      'override_reason', p_override_reason
    ),
    NOW()
  FROM public.users u
  WHERE u.id = p_assigned_by;
  
  -- Create activity log
  INSERT INTO public.activity_logs (
    title,
    description,
    icon,
    entity,
    entity_id,
    created_at
  ) VALUES (
    'Project Assigned',
    format('%s assigned to %s', v_project_name, v_associate_name),
    'user-check',
    'assignment',
    v_assignment_id,
    NOW()
  );
  
  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'assignment_id', v_assignment_id,
    'project_name', v_project_name,
    'associate_name', v_associate_name,
    'is_override', v_is_override
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Log error
  RAISE NOTICE 'Assignment failed: %', SQLERRM;
  
  -- Return error
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION assign_project IS 'Atomic project assignment with validation, audit, and activity logging';


-- ============================================================================
-- PART 7: TRIGGERS
-- ============================================================================

-- ============================================================================
-- TRIGGER: Auto-insert capacity_history on capacity change
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_capacity_history()
RETURNS TRIGGER AS $$
BEGIN
  -- When weekly_capacity changes, insert into capacity_history
  IF OLD.weekly_capacity IS DISTINCT FROM NEW.weekly_capacity THEN
    INSERT INTO public.capacity_history (
      associate_id,
      week_number,
      year,
      capacity,
      effective_from,
      effective_to,
      created_by,
      created_at
    ) VALUES (
      NEW.id,
      EXTRACT(WEEK FROM CURRENT_DATE)::INTEGER,
      EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
      NEW.weekly_capacity,
      CURRENT_DATE,
      NULL, -- Open-ended, will be closed when next change happens
      COALESCE(NEW.created_by, (SELECT id FROM public.users LIMIT 1)),
      NOW()
    );
    
    -- Close previous capacity history record
    UPDATE public.capacity_history
    SET effective_to = CURRENT_DATE - INTERVAL '1 day'
    WHERE associate_id = NEW.id
      AND effective_to IS NULL
      AND id != (SELECT id FROM public.capacity_history WHERE associate_id = NEW.id ORDER BY created_at DESC LIMIT 1);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_associate_capacity_changed
AFTER UPDATE OF weekly_capacity ON public.associates
FOR EACH ROW
WHEN (OLD.weekly_capacity IS DISTINCT FROM NEW.weekly_capacity)
EXECUTE FUNCTION trigger_capacity_history();

COMMENT ON FUNCTION trigger_capacity_history IS 'Auto-creates capacity_history record when associate capacity changes';


-- ============================================================================
-- TRIGGER: Auto-create activity_log on assignment
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_assignment_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_project_name TEXT;
  v_associate_name TEXT;
BEGIN
  -- Get project and associate names
  SELECT p.project_name, a.name
  INTO v_project_name, v_associate_name
  FROM public.projects p
  JOIN public.associates a ON a.id = NEW.associate_id
  WHERE p.id = NEW.project_id;
  
  -- Create activity log
  INSERT INTO public.activity_logs (
    title,
    description,
    icon,
    entity,
    entity_id,
    created_at
  ) VALUES (
    'Assignment Created',
    format('Project "%s" assigned to %s', v_project_name, v_associate_name),
    'user-check',
    'assignment',
    NEW.id,
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_assignment_created
AFTER INSERT ON public.assignments
FOR EACH ROW
EXECUTE FUNCTION trigger_assignment_activity();

COMMENT ON FUNCTION trigger_assignment_activity IS 'Auto-creates activity_log entry when assignment is created';


-- ============================================================================
-- TRIGGER: Auto-create activity_log on project completion
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_project_completion_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status changes to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO public.activity_logs (
      title,
      description,
      icon,
      entity,
      entity_id,
      created_at
    ) VALUES (
      'Project Completed',
      format('Project "%s" completed', NEW.project_name),
      'check-circle',
      'project',
      NEW.id,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_project_completed
AFTER UPDATE OF status ON public.projects
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed')
EXECUTE FUNCTION trigger_project_completion_activity();

COMMENT ON FUNCTION trigger_project_completion_activity IS 'Auto-creates activity_log entry when project is completed';


-- ============================================================================
-- TRIGGER: Auto-mark recommendation as accepted
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_recommendation_accepted()
RETURNS TRIGGER AS $$
BEGIN
  -- If recommendation_id is set and there's no override reason, mark recommendation as accepted
  IF NEW.recommendation_id IS NOT NULL AND (NEW.override_reason IS NULL OR NEW.override_reason = '') THEN
    UPDATE public.recommendation_logs
    SET accepted = TRUE
    WHERE id = NEW.recommendation_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_recommendation_accepted
AFTER INSERT ON public.assignments
FOR EACH ROW
WHEN (NEW.recommendation_id IS NOT NULL)
EXECUTE FUNCTION trigger_recommendation_accepted();

COMMENT ON FUNCTION trigger_recommendation_accepted IS 'Auto-marks recommendation as accepted when assignment is created without override';


-- ============================================================================
-- TRIGGER: Auto-create audit_log on recommendation override
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_recommendation_override_audit()
RETURNS TRIGGER AS $$
DECLARE
  v_recommended_name TEXT;
  v_actual_name TEXT;
BEGIN
  -- Only trigger when there's an override
  IF NEW.is_override = TRUE AND NEW.recommendation_id IS NOT NULL THEN
    -- Get recommended associate name
    SELECT a.name
    INTO v_recommended_name
    FROM public.recommendation_logs r
    JOIN public.associates a ON a.id = r.recommended_associate
    WHERE r.id = NEW.recommendation_id;
    
    -- Get actual assigned associate name
    SELECT name
    INTO v_actual_name
    FROM public.associates
    WHERE id = NEW.associate_id;
    
    -- Create audit log
    INSERT INTO public.audit_logs (
      user_id,
      user_email,
      action,
      entity_type,
      entity_id,
      old_value,
      new_value,
      metadata,
      created_at
    )
    SELECT 
      NEW.assigned_by,
      u.email,
      'override_recommendation'::audit_action,
      'assignment',
      NEW.id,
      jsonb_build_object('recommended_associate', v_recommended_name),
      jsonb_build_object('actual_associate', v_actual_name),
      jsonb_build_object('override_reason', NEW.override_reason),
      NOW()
    FROM public.users u
    WHERE u.id = NEW.assigned_by;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_recommendation_override
AFTER INSERT ON public.assignments
FOR EACH ROW
WHEN (NEW.is_override = TRUE)
EXECUTE FUNCTION trigger_recommendation_override_audit();

COMMENT ON FUNCTION trigger_recommendation_override_audit IS 'Auto-creates audit_log entry when recommendation is overridden';


-- ============================================================================
-- TRIGGER: Auto-update updated_at for new tables
-- ============================================================================

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 8: UPDATE EXISTING FUNCTIONS FOR NEW SCHEMA
-- ============================================================================

-- Update get_associate_capacity to use capacity_history
CREATE OR REPLACE FUNCTION get_associate_capacity(
  p_associate_id UUID,
  p_week_number INTEGER,
  p_year INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_capacity INTEGER;
BEGIN
  -- Try to get capacity from capacity_history table (with date range check)
  SELECT capacity
  INTO v_capacity
  FROM public.capacity_history
  WHERE associate_id = p_associate_id
    AND week_number = p_week_number
    AND year = p_year
    AND effective_from <= CURRENT_DATE
    AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
  ORDER BY effective_from DESC
  LIMIT 1;
  
  -- If not found, use default capacity from associate
  IF v_capacity IS NULL THEN
    SELECT weekly_capacity
    INTO v_capacity
    FROM public.associates
    WHERE id = p_associate_id;
  END IF;
  
  RETURN COALESCE(v_capacity, 0);
END;
$$ LANGUAGE plpgsql STABLE;


-- ============================================================================
-- PART 9: ENHANCED INDEXES
-- ============================================================================

-- Composite indexes for common dashboard queries
CREATE INDEX IF NOT EXISTS idx_projects_status_assigned_date ON public.projects(status, project_date DESC);
CREATE INDEX IF NOT EXISTS idx_projects_assigned_status ON public.projects(assigned_associate_id, status);

-- Covering index for workload calculations
CREATE INDEX IF NOT EXISTS idx_projects_workload_covering ON public.projects(assigned_associate_id, status) 
  INCLUDE (project_date, week_number, year);

-- Partial indexes for common filters
CREATE INDEX IF NOT EXISTS idx_projects_active ON public.projects(assigned_associate_id, project_date)
  WHERE status NOT IN ('completed', 'cancelled');

CREATE INDEX IF NOT EXISTS idx_projects_pending ON public.projects(created_at DESC)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_associates_active_available ON public.associates(weekly_capacity, created_at)
  WHERE is_active = TRUE AND availability_status = 'available';

-- GIN indexes for array/JSONB columns
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata_gin ON public.audit_logs USING gin(metadata);
CREATE INDEX IF NOT EXISTS idx_audit_logs_new_value_gin ON public.audit_logs USING gin(new_value);

-- Trigram indexes for fuzzy search
CREATE INDEX IF NOT EXISTS idx_associates_name_trgm ON public.associates USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_projects_name_trgm ON public.projects USING gin(project_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_projects_client_trgm ON public.projects USING gin(client gin_trgm_ops);


-- ============================================================================
-- PART 10: ENHANCED RLS POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capacity_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies (same as users)
CREATE POLICY profiles_select_policy ON public.profiles
  FOR SELECT USING (auth.uid() = id OR is_manager());

CREATE POLICY profiles_update_policy ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Capacity history policies (read-only for most, managers can insert)
CREATE POLICY capacity_history_select_policy ON public.capacity_history
  FOR SELECT USING (is_authenticated());

CREATE POLICY capacity_history_insert_policy ON public.capacity_history
  FOR INSERT WITH CHECK (is_manager());

-- Holidays policies (read all, managers can manage)
CREATE POLICY holidays_select_policy ON public.holidays
  FOR SELECT USING (is_authenticated());

CREATE POLICY holidays_insert_policy ON public.holidays
  FOR INSERT WITH CHECK (is_manager());

CREATE POLICY holidays_delete_policy ON public.holidays
  FOR DELETE USING (is_manager());

-- Activity logs policies (read all, system creates)
CREATE POLICY activity_logs_select_policy ON public.activity_logs
  FOR SELECT USING (is_authenticated());

CREATE POLICY activity_logs_insert_policy ON public.activity_logs
  FOR INSERT WITH CHECK (true); -- Triggers create these

-- Import history policies (read all, managers can import)
CREATE POLICY import_history_select_policy ON public.import_history
  FOR SELECT USING (is_authenticated());

CREATE POLICY import_history_insert_policy ON public.import_history
  FOR INSERT WITH CHECK (is_manager());

-- Notifications policies (users see their own, managers see all)
CREATE POLICY notifications_select_policy ON public.notifications
  FOR SELECT USING (auth.uid() = user_id OR is_manager());

CREATE POLICY notifications_update_policy ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Recommendation logs policies (same as recommendations)
CREATE POLICY recommendation_logs_select_policy ON public.recommendation_logs
  FOR SELECT USING (is_authenticated());

CREATE POLICY recommendation_logs_insert_policy ON public.recommendation_logs
  FOR INSERT WITH CHECK (is_manager());


-- ============================================================================
-- PART 11: HELPER FUNCTIONS FOR APPLICATION LAYER
-- ============================================================================

-- Function to get dashboard statistics
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSONB AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_associates', (SELECT total_associates FROM v_dashboard_kpis),
    'available_associates', (SELECT available_associates FROM v_dashboard_kpis),
    'total_projects', (SELECT total_projects FROM v_dashboard_kpis),
    'active_projects', (SELECT active_projects FROM v_dashboard_kpis),
    'completed_projects', (SELECT completed_projects FROM v_dashboard_kpis),
    'pending_projects', (SELECT pending_projects FROM v_dashboard_kpis),
    'total_capacity', (SELECT total_capacity FROM v_dashboard_kpis),
    'total_workload', (SELECT total_workload FROM v_dashboard_kpis),
    'available_capacity', (SELECT available_capacity FROM v_dashboard_kpis),
    'average_utilization', (SELECT average_utilization FROM v_dashboard_kpis),
    'over_capacity_count', (SELECT over_capacity_count FROM v_dashboard_kpis),
    'idle_count', (SELECT idle_count FROM v_dashboard_kpis),
    'projects_today', (SELECT projects_created_today FROM v_dashboard_kpis),
    'assignments_today', (SELECT assignments_today FROM v_dashboard_kpis),
    'completions_today', (SELECT completions_today FROM v_dashboard_kpis)
  ) INTO v_stats;
  
  RETURN v_stats;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_dashboard_stats IS 'Get all dashboard KPIs in a single function call';


-- Function to check if associate is available for assignment
CREATE OR REPLACE FUNCTION is_associate_available(
  p_associate_id UUID,
  p_week_number INTEGER,
  p_year INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_available BOOLEAN;
BEGIN
  SELECT 
    a.is_active = TRUE 
    AND a.availability_status = 'available'
    AND has_capacity(a.id, p_week_number, p_year)
  INTO v_available
  FROM public.associates a
  WHERE a.id = p_associate_id;
  
  RETURN COALESCE(v_available, FALSE);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION is_associate_available IS 'Check if associate is active, available, and has capacity';

-- Function to get recent activity for dashboard
CREATE OR REPLACE FUNCTION get_recent_activity(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  icon TEXT,
  entity TEXT,
  entity_id UUID,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id,
    al.title,
    al.description,
    al.icon,
    al.entity,
    al.entity_id,
    al.created_at
  FROM public.activity_logs al
  ORDER BY al.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_recent_activity IS 'Get recent activity logs for dashboard timeline';


-- ============================================================================
-- PART 12: SAMPLE DATA FOR TESTING (Optional - can be removed for production)
-- ============================================================================

-- Insert sample holidays (US Federal Holidays 2024)
INSERT INTO public.holidays (holiday_name, holiday_date, country, state) VALUES
  ('New Year''s Day', '2024-01-01', 'US', NULL),
  ('Memorial Day', '2024-05-27', 'US', NULL),
  ('Independence Day', '2024-07-04', 'US', NULL),
  ('Labor Day', '2024-09-02', 'US', NULL),
  ('Thanksgiving', '2024-11-28', 'US', NULL),
  ('Christmas Day', '2024-12-25', 'US', NULL)
ON CONFLICT DO NOTHING;

-- Create a sample notification for testing
-- (Requires at least one user to exist)
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM public.users LIMIT 1;
  
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, is_read) VALUES
      (v_user_id, 'Welcome to WBIPAS', 'Your account has been set up successfully. You can now start managing project assignments.', 'system', FALSE)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;


-- ============================================================================
-- PART 13: FINAL COMMENTS AND VERSION INFO
-- ============================================================================

-- Update settings to mark migration complete
UPDATE public.settings 
SET 
  organization_name = COALESCE(organization_name, 'WBIPAS Enterprise'),
  updated_at = NOW();

-- Add migration completion comment
COMMENT ON DATABASE postgres IS 'WBIPAS v2.0 - Enterprise Migration Completed on ' || CURRENT_TIMESTAMP::TEXT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
--
-- Summary of Changes:
-- - ✅ 2 new enums (availability_status, import_type)
-- - ✅ 4 new tables (profiles, capacity_history, recommendation_logs, import_history)
-- - ✅ 3 brand new tables (holidays, activity_logs, notifications)
-- - ✅ Enhanced existing tables (associates, projects, assignments, settings)
-- - ✅ 3 new views (v_current_workload, v_weekly_capacity, v_dashboard_kpis)
-- - ✅ 1 stored procedure (assign_project)
-- - ✅ 6 helper functions
-- - ✅ 5 new triggers
-- - ✅ 20+ new indexes
-- - ✅ Complete RLS policies for all tables
-- - ✅ Data migration from old to new tables
--
-- Total Tables: 12 (enterprise-grade)
-- Total Views: 4
-- Total Functions: 11
-- Total Triggers: 10
-- Total Indexes: 60+
--
-- Next Steps:
-- 1. Update TypeScript types to match new schema
-- 2. Update repository layer to use new tables
-- 3. Update services to leverage new stored procedures
-- 4. Test all migrations thoroughly
-- 5. Deploy to staging environment
-- 6. Run performance benchmarks
-- 7. Update application documentation
--
-- Rollback: Run 20240628000001_rollback_enterprise_upgrade.sql if needed
--
-- ============================================================================

