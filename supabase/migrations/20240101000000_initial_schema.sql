-- ============================================================================
-- WBIPAS Database Schema
-- Workload Balancing & Intelligent Project Assignment System
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Project Status Enum
CREATE TYPE project_status AS ENUM (
  'pending',
  'assigned',
  'in_progress',
  'completed',
  'cancelled',
  'on_hold'
);

-- Project Priority Enum
CREATE TYPE project_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

-- Project Source Enum
CREATE TYPE project_source AS ENUM (
  'manual',
  'opening_balance',
  'api',
  'import'
);

-- Audit Action Enum
CREATE TYPE audit_action AS ENUM (
  'login',
  'logout',
  'create_associate',
  'update_associate',
  'delete_associate',
  'disable_associate',
  'enable_associate',
  'create_project',
  'update_project',
  'assign_project',
  'complete_project',
  'cancel_project',
  'update_capacity',
  'import_opening_balance',
  'delete_import',
  'update_settings',
  'override_recommendation'
);

-- ============================================================================
-- TABLE: users (extends auth.users)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'manager',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);

-- ============================================================================
-- TABLE: associates
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.associates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  weekly_capacity INTEGER NOT NULL DEFAULT 5,
  department TEXT,
  skills TEXT[],
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES public.users(id),
  
  -- Constraints
  CONSTRAINT chk_weekly_capacity CHECK (weekly_capacity > 0 AND weekly_capacity <= 100)
);

-- Indexes
CREATE INDEX idx_associates_employee_id ON public.associates(employee_id);
CREATE INDEX idx_associates_email ON public.associates(email);
CREATE INDEX idx_associates_is_active ON public.associates(is_active);
CREATE INDEX idx_associates_is_available ON public.associates(is_available);
CREATE INDEX idx_associates_department ON public.associates(department);
CREATE INDEX idx_associates_created_by ON public.associates(created_by);

-- Full-text search index
CREATE INDEX idx_associates_name_fts ON public.associates USING gin(to_tsvector('english', name));

-- ============================================================================
-- TABLE: capacities
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.capacities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  associate_id UUID NOT NULL REFERENCES public.associates(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  weekly_capacity INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT chk_week_number CHECK (week_number >= 1 AND week_number <= 53),
  CONSTRAINT chk_year CHECK (year >= 2020 AND year <= 2100),
  CONSTRAINT chk_capacity_value CHECK (weekly_capacity > 0 AND weekly_capacity <= 100),
  CONSTRAINT uq_associate_week_year UNIQUE (associate_id, week_number, year)
);

-- Indexes
CREATE INDEX idx_capacities_associate_id ON public.capacities(associate_id);
CREATE INDEX idx_capacities_week_year ON public.capacities(week_number, year);
CREATE INDEX idx_capacities_associate_week_year ON public.capacities(associate_id, week_number, year);

-- ============================================================================
-- TABLE: projects
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id TEXT UNIQUE NOT NULL,
  project_name TEXT NOT NULL,
  client TEXT NOT NULL,
  project_date DATE NOT NULL,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  priority project_priority NOT NULL DEFAULT 'medium',
  status project_status NOT NULL DEFAULT 'pending',
  comments TEXT,
  assigned_associate_id UUID REFERENCES public.associates(id) ON DELETE SET NULL,
  assigned_associate_name TEXT,
  completion_date TIMESTAMPTZ,
  source project_source NOT NULL DEFAULT 'manual',
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT chk_project_week_number CHECK (week_number >= 1 AND week_number <= 53),
  CONSTRAINT chk_project_year CHECK (year >= 2020 AND year <= 2100)
);

-- Indexes
CREATE INDEX idx_projects_project_id ON public.projects(project_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_assigned_associate ON public.projects(assigned_associate_id);
CREATE INDEX idx_projects_week_year ON public.projects(week_number, year);
CREATE INDEX idx_projects_project_date ON public.projects(project_date);
CREATE INDEX idx_projects_client ON public.projects(client);
CREATE INDEX idx_projects_priority ON public.projects(priority);
CREATE INDEX idx_projects_created_by ON public.projects(created_by);
CREATE INDEX idx_projects_source ON public.projects(source);

-- Full-text search indexes
CREATE INDEX idx_projects_name_fts ON public.projects USING gin(to_tsvector('english', project_name));
CREATE INDEX idx_projects_client_fts ON public.projects USING gin(to_tsvector('english', client));

-- Composite index for common queries
CREATE INDEX idx_projects_status_week_year ON public.projects(status, week_number, year);

-- ============================================================================
-- TABLE: assignments
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  associate_id UUID NOT NULL REFERENCES public.associates(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES public.users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recommended_associate_id UUID REFERENCES public.associates(id) ON DELETE SET NULL,
  override_reason TEXT,
  is_override BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Ensure one assignment per project
  CONSTRAINT uq_project_assignment UNIQUE (project_id)
);

-- Indexes
CREATE INDEX idx_assignments_project_id ON public.assignments(project_id);
CREATE INDEX idx_assignments_associate_id ON public.assignments(associate_id);
CREATE INDEX idx_assignments_assigned_by ON public.assignments(assigned_by);
CREATE INDEX idx_assignments_assigned_at ON public.assignments(assigned_at);
CREATE INDEX idx_assignments_is_override ON public.assignments(is_override);

-- ============================================================================
-- TABLE: recommendations
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  recommended_associate_id UUID NOT NULL REFERENCES public.associates(id) ON DELETE CASCADE,
  recommended_associate_name TEXT NOT NULL,
  workload_before INTEGER NOT NULL DEFAULT 0,
  workload_after INTEGER NOT NULL DEFAULT 0,
  explanation TEXT NOT NULL,
  was_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  actual_assigned_associate_id UUID REFERENCES public.associates(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT chk_workload_values CHECK (workload_before >= 0 AND workload_after >= 0)
);

-- Indexes
CREATE INDEX idx_recommendations_project_id ON public.recommendations(project_id);
CREATE INDEX idx_recommendations_associate_id ON public.recommendations(recommended_associate_id);
CREATE INDEX idx_recommendations_was_accepted ON public.recommendations(was_accepted);
CREATE INDEX idx_recommendations_created_at ON public.recommendations(created_at);

-- ============================================================================
-- TABLE: opening_balance
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.opening_balance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id TEXT NOT NULL,
  project_name TEXT NOT NULL,
  client TEXT NOT NULL,
  project_date DATE NOT NULL,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  assigned_associate_id UUID NOT NULL REFERENCES public.associates(id) ON DELETE CASCADE,
  imported_by UUID NOT NULL REFERENCES public.users(id),
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  import_batch_id UUID NOT NULL,
  
  -- Constraints
  CONSTRAINT chk_ob_week_number CHECK (week_number >= 1 AND week_number <= 53),
  CONSTRAINT chk_ob_year CHECK (year >= 2020 AND year <= 2100),
  CONSTRAINT uq_opening_balance_project UNIQUE (project_id, import_batch_id)
);

-- Indexes
CREATE INDEX idx_opening_balance_associate_id ON public.opening_balance(assigned_associate_id);
CREATE INDEX idx_opening_balance_batch_id ON public.opening_balance(import_batch_id);
CREATE INDEX idx_opening_balance_imported_by ON public.opening_balance(imported_by);
CREATE INDEX idx_opening_balance_week_year ON public.opening_balance(week_number, year);

-- ============================================================================
-- TABLE: opening_balance_import_logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.opening_balance_import_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID UNIQUE NOT NULL,
  total_records INTEGER NOT NULL DEFAULT 0,
  successful_imports INTEGER NOT NULL DEFAULT 0,
  failed_imports INTEGER NOT NULL DEFAULT 0,
  errors JSONB,
  imported_by UUID NOT NULL REFERENCES public.users(id),
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT chk_import_counts CHECK (
    total_records >= 0 AND 
    successful_imports >= 0 AND 
    failed_imports >= 0 AND
    successful_imports + failed_imports <= total_records
  )
);

-- Indexes
CREATE INDEX idx_import_logs_batch_id ON public.opening_balance_import_logs(batch_id);
CREATE INDEX idx_import_logs_imported_by ON public.opening_balance_import_logs(imported_by);
CREATE INDEX idx_import_logs_imported_at ON public.opening_balance_import_logs(imported_at);

-- ============================================================================
-- TABLE: audit_logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  action audit_action NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for audit logs
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX idx_audit_logs_entity_id ON public.audit_logs(entity_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Composite index for common audit queries
CREATE INDEX idx_audit_logs_user_action_date ON public.audit_logs(user_id, action, created_at);

-- ============================================================================
-- TABLE: settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_name TEXT NOT NULL DEFAULT 'WBIPAS Organization',
  week_start_day INTEGER NOT NULL DEFAULT 1,
  default_weekly_capacity INTEGER NOT NULL DEFAULT 5,
  enable_ai_recommendations BOOLEAN NOT NULL DEFAULT FALSE,
  enable_email_notifications BOOLEAN NOT NULL DEFAULT FALSE,
  theme TEXT NOT NULL DEFAULT 'light',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT chk_week_start_day CHECK (week_start_day >= 0 AND week_start_day <= 6),
  CONSTRAINT chk_default_capacity CHECK (default_weekly_capacity > 0 AND default_weekly_capacity <= 100),
  CONSTRAINT chk_theme CHECK (theme IN ('light', 'dark', 'system'))
);

-- Ensure only one settings row exists
CREATE UNIQUE INDEX idx_settings_singleton ON public.settings((id IS NOT NULL));

-- Insert default settings
INSERT INTO public.settings (id, organization_name) 
VALUES (uuid_generate_v4(), 'WBIPAS Organization')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TRIGGERS: updated_at
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_associates_updated_at BEFORE UPDATE ON public.associates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_capacities_updated_at BEFORE UPDATE ON public.capacities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TRIGGERS: Automatic Week/Year Calculation
-- ============================================================================

-- Function to calculate week number from date
CREATE OR REPLACE FUNCTION calculate_week_year()
RETURNS TRIGGER AS $$
BEGIN
  NEW.week_number := EXTRACT(WEEK FROM NEW.project_date);
  NEW.year := EXTRACT(YEAR FROM NEW.project_date);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to projects and opening_balance
CREATE TRIGGER calculate_projects_week_year BEFORE INSERT OR UPDATE OF project_date ON public.projects
  FOR EACH ROW EXECUTE FUNCTION calculate_week_year();

CREATE TRIGGER calculate_opening_balance_week_year BEFORE INSERT OR UPDATE OF project_date ON public.opening_balance
  FOR EACH ROW EXECUTE FUNCTION calculate_week_year();

-- ============================================================================
-- FUNCTIONS: Helper Functions
-- ============================================================================

-- Function to get associate workload for a specific week
CREATE OR REPLACE FUNCTION get_associate_workload(
  p_associate_id UUID,
  p_week_number INTEGER,
  p_year INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_workload INTEGER;
BEGIN
  -- Count active projects (not completed or cancelled)
  SELECT COUNT(*)
  INTO v_workload
  FROM public.projects
  WHERE assigned_associate_id = p_associate_id
    AND week_number = p_week_number
    AND year = p_year
    AND status NOT IN ('completed', 'cancelled');
  
  -- Add opening balance projects
  SELECT v_workload + COUNT(*)
  INTO v_workload
  FROM public.opening_balance
  WHERE assigned_associate_id = p_associate_id
    AND week_number = p_week_number
    AND year = p_year;
  
  RETURN COALESCE(v_workload, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get associate capacity for a specific week
CREATE OR REPLACE FUNCTION get_associate_capacity(
  p_associate_id UUID,
  p_week_number INTEGER,
  p_year INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_capacity INTEGER;
BEGIN
  -- Try to get capacity from capacities table
  SELECT weekly_capacity
  INTO v_capacity
  FROM public.capacities
  WHERE associate_id = p_associate_id
    AND week_number = p_week_number
    AND year = p_year;
  
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

-- Function to check if associate has capacity
CREATE OR REPLACE FUNCTION has_capacity(
  p_associate_id UUID,
  p_week_number INTEGER,
  p_year INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_workload INTEGER;
  v_capacity INTEGER;
BEGIN
  v_workload := get_associate_workload(p_associate_id, p_week_number, p_year);
  v_capacity := get_associate_capacity(p_associate_id, p_week_number, p_year);
  
  RETURN v_workload < v_capacity;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get oldest active project date for an associate
CREATE OR REPLACE FUNCTION get_oldest_project_date(
  p_associate_id UUID
)
RETURNS DATE AS $$
DECLARE
  v_oldest_date DATE;
BEGIN
  SELECT MIN(project_date)
  INTO v_oldest_date
  FROM public.projects
  WHERE assigned_associate_id = p_associate_id
    AND status NOT IN ('completed', 'cancelled');
  
  -- Check opening balance too
  SELECT LEAST(v_oldest_date, MIN(project_date))
  INTO v_oldest_date
  FROM public.opening_balance
  WHERE assigned_associate_id = p_associate_id;
  
  RETURN v_oldest_date;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- VIEWS: Materialized views for performance
-- ============================================================================

-- View: Associate with current workload
CREATE OR REPLACE VIEW v_associates_with_workload AS
SELECT 
  a.*,
  COALESCE(
    (SELECT COUNT(*) 
     FROM public.projects p 
     WHERE p.assigned_associate_id = a.id 
       AND p.status NOT IN ('completed', 'cancelled')
    ), 0
  ) +
  COALESCE(
    (SELECT COUNT(*) 
     FROM public.opening_balance ob 
     WHERE ob.assigned_associate_id = a.id
    ), 0
  ) AS current_workload,
  a.weekly_capacity - (
    COALESCE(
      (SELECT COUNT(*) 
       FROM public.projects p 
       WHERE p.assigned_associate_id = a.id 
         AND p.status NOT IN ('completed', 'cancelled')
      ), 0
    ) +
    COALESCE(
      (SELECT COUNT(*) 
       FROM public.opening_balance ob 
       WHERE ob.assigned_associate_id = a.id
      ), 0
    )
  ) AS available_capacity,
  CASE 
    WHEN a.weekly_capacity > 0 THEN
      ROUND(
        (
          COALESCE(
            (SELECT COUNT(*) 
             FROM public.projects p 
             WHERE p.assigned_associate_id = a.id 
               AND p.status NOT IN ('completed', 'cancelled')
            ), 0
          ) +
          COALESCE(
            (SELECT COUNT(*) 
             FROM public.opening_balance ob 
             WHERE ob.assigned_associate_id = a.id
            ), 0
          )
        )::NUMERIC / a.weekly_capacity::NUMERIC * 100, 2
      )
    ELSE 0
  END AS utilization_percentage
FROM public.associates a;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.users IS 'Extends auth.users with application-specific user data';
COMMENT ON TABLE public.associates IS 'Associates who can be assigned projects';
COMMENT ON TABLE public.capacities IS 'Week-specific capacity overrides for associates';
COMMENT ON TABLE public.projects IS 'All projects in the system';
COMMENT ON TABLE public.assignments IS 'Assignment history linking projects to associates';
COMMENT ON TABLE public.recommendations IS 'Recommendation engine history';
COMMENT ON TABLE public.opening_balance IS 'Historical projects imported at system start';
COMMENT ON TABLE public.opening_balance_import_logs IS 'Logs of opening balance imports';
COMMENT ON TABLE public.audit_logs IS 'Comprehensive audit trail of all system actions';
COMMENT ON TABLE public.settings IS 'Global system settings (singleton table)';

COMMENT ON FUNCTION get_associate_workload IS 'Calculate total active workload for an associate in a specific week';
COMMENT ON FUNCTION get_associate_capacity IS 'Get capacity for an associate in a specific week (with fallback to default)';
COMMENT ON FUNCTION has_capacity IS 'Check if associate has available capacity in a specific week';
COMMENT ON FUNCTION get_oldest_project_date IS 'Get the oldest active project date for an associate';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
