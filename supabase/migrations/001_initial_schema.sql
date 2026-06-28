-- =====================================================
-- WBIPAS - Initial Database Schema
-- Enterprise-Grade Schema with Complete Audit Trail
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PROFILES TABLE
-- Extends Supabase auth.users
-- =====================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'manager' CHECK (role IN ('admin', 'manager', 'viewer')),
  avatar_url TEXT,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);

-- =====================================================
-- 2. ASSOCIATES TABLE
-- Core table for team members
-- =====================================================
CREATE TABLE associates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  default_weekly_capacity INTEGER NOT NULL DEFAULT 5 CHECK (default_weekly_capacity >= 1 AND default_weekly_capacity <= 100),
  availability_status TEXT NOT NULL DEFAULT 'available' CHECK (availability_status IN ('available', 'leave', 'training', 'holiday', 'inactive')),
  department TEXT,
  designation TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_associates_employee_code ON associates(employee_code);
CREATE INDEX idx_associates_email ON associates(email);
CREATE INDEX idx_associates_is_active ON associates(is_active);
CREATE INDEX idx_associates_availability ON associates(availability_status);

-- =====================================================
-- 3. CAPACITY_HISTORY TABLE
-- Historical capacity tracking (never modify past weeks)
-- =====================================================
CREATE TABLE capacity_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  associate_id UUID NOT NULL REFERENCES associates(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 53),
  year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
  weekly_capacity INTEGER NOT NULL CHECK (weekly_capacity >= 1 AND weekly_capacity <= 100),
  changed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(associate_id, week_number, year)
);

-- Indexes for time-based queries
CREATE INDEX idx_capacity_history_associate ON capacity_history(associate_id);
CREATE INDEX idx_capacity_history_week_year ON capacity_history(week_number, year);

-- =====================================================
-- 4. PROJECTS TABLE
-- All projects (including opening balance)
-- =====================================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id TEXT UNIQUE NOT NULL,
  project_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  project_date DATE NOT NULL,
  week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 53),
  year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'on_hold', 'completed', 'cancelled')),
  comments TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'opening_balance', 'import')),
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_projects_project_id ON projects(project_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_week_year ON projects(week_number, year);
CREATE INDEX idx_projects_date ON projects(project_date);
CREATE INDEX idx_projects_client ON projects(client_name);

-- =====================================================
-- 5. ASSIGNMENTS TABLE
-- Project assignment history (never delete)
-- =====================================================
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  associate_id UUID NOT NULL REFERENCES associates(id),
  is_current BOOLEAN NOT NULL DEFAULT true,
  assigned_by UUID REFERENCES profiles(id),
  assignment_reason TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_assignments_project ON assignments(project_id);
CREATE INDEX idx_assignments_associate ON assignments(associate_id);
CREATE INDEX idx_assignments_current ON assignments(is_current) WHERE is_current = true;

-- =====================================================
-- 6. RECOMMENDATION_LOGS TABLE
-- Complete recommendation audit trail
-- =====================================================
CREATE TABLE recommendation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  recommended_associate_id UUID NOT NULL REFERENCES associates(id),
  assigned_associate_id UUID REFERENCES associates(id),
  algorithm_version TEXT NOT NULL DEFAULT '2.0.0',
  recommendation_reason JSONB NOT NULL,
  top_candidates JSONB NOT NULL,
  was_overridden BOOLEAN NOT NULL DEFAULT false,
  override_reason TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_recommendation_logs_project ON recommendation_logs(project_id);
CREATE INDEX idx_recommendation_logs_recommended ON recommendation_logs(recommended_associate_id);
CREATE INDEX idx_recommendation_logs_assigned ON recommendation_logs(assigned_associate_id);
CREATE INDEX idx_recommendation_logs_overridden ON recommendation_logs(was_overridden);

-- =====================================================
-- 7. AUDIT_LOGS TABLE
-- Complete system audit trail
-- =====================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'disable', 'enable', 'assign', 'reassign', 'complete', 'cancel', 'import')),
  old_values JSONB,
  new_values JSONB,
  performed_by UUID REFERENCES profiles(id),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for audit queries
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_performed_by ON audit_logs(performed_by);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- =====================================================
-- 8. SETTINGS TABLE
-- Application configuration
-- =====================================================
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('general', 'recommendation', 'notification', 'integration')),
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_settings_category ON settings(category);

-- =====================================================
-- 9. HOLIDAYS TABLE
-- Public holidays and team holidays
-- =====================================================
CREATE TABLE holidays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_holidays_date ON holidays(date);

-- =====================================================
-- 10. IMPORT_HISTORY TABLE
-- Track all imports (opening balance, bulk)
-- =====================================================
CREATE TABLE import_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  import_type TEXT NOT NULL CHECK (import_type IN ('opening_balance', 'bulk_projects', 'associates')),
  file_name TEXT,
  total_records INTEGER NOT NULL,
  successful_records INTEGER NOT NULL,
  failed_records INTEGER NOT NULL,
  skipped_records INTEGER NOT NULL,
  error_log JSONB,
  imported_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_import_history_type ON import_history(import_type);
CREATE INDEX idx_import_history_created_at ON import_history(created_at DESC);

-- =====================================================
-- 11. ACTIVITY_LOGS TABLE
-- User activity timeline
-- =====================================================
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_type TEXT NOT NULL CHECK (activity_type IN ('project_created', 'project_assigned', 'project_completed', 'associate_added', 'capacity_updated', 'import_completed', 'recommendation_overridden')),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_activity_logs_type ON activity_logs(activity_type);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- =====================================================
-- 12. NOTIFICATIONS TABLE
-- User notifications (future feature)
-- =====================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger: Update updated_at on profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_associates_updated_at
  BEFORE UPDATE ON associates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Create audit log on associate changes
CREATE OR REPLACE FUNCTION audit_associate_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (entity_type, entity_id, action, old_values, new_values, performed_by)
    VALUES ('associate', NEW.id, 'update', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (entity_type, entity_id, action, new_values, performed_by)
    VALUES ('associate', NEW.id, 'create', to_jsonb(NEW), auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_associate_trigger
  AFTER INSERT OR UPDATE ON associates
  FOR EACH ROW
  EXECUTE FUNCTION audit_associate_changes();

-- Trigger: Create activity log on project assignment
CREATE OR REPLACE FUNCTION log_project_assignment()
RETURNS TRIGGER AS $$
DECLARE
  project_name TEXT;
  associate_name TEXT;
BEGIN
  SELECT p.project_name INTO project_name FROM projects p WHERE p.id = NEW.project_id;
  SELECT a.name INTO associate_name FROM associates a WHERE a.id = NEW.associate_id;
  
  INSERT INTO activity_logs (activity_type, description, metadata, user_id)
  VALUES (
    'project_assigned',
    associate_name || ' assigned to ' || project_name,
    jsonb_build_object('project_id', NEW.project_id, 'associate_id', NEW.associate_id),
    auth.uid()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER log_assignment_trigger
  AFTER INSERT ON assignments
  FOR EACH ROW
  WHEN (NEW.is_current = true)
  EXECUTE FUNCTION log_project_assignment();

-- =====================================================
-- SEED DEFAULT SETTINGS
-- =====================================================
INSERT INTO settings (key, value, category, description) VALUES
  ('week_start', '"monday"', 'general', 'First day of the week'),
  ('default_capacity', '5', 'general', 'Default weekly capacity for new associates'),
  ('enable_fifo', 'true', 'recommendation', 'Enable FIFO rule in recommendations'),
  ('enable_simulation', 'true', 'recommendation', 'Enable recommendation simulation'),
  ('allow_manual_override', 'true', 'recommendation', 'Allow managers to override recommendations');

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE associates IS 'Team members who receive project assignments';
COMMENT ON TABLE capacity_history IS 'Historical record of capacity changes (immutable)';
COMMENT ON TABLE projects IS 'All projects including opening balance';
COMMENT ON TABLE assignments IS 'Complete assignment history with reassignment support';
COMMENT ON TABLE recommendation_logs IS 'Audit trail of all recommendation engine executions';
COMMENT ON TABLE audit_logs IS 'System-wide audit trail for compliance';
COMMENT ON TABLE activity_logs IS 'User activity timeline for dashboard';
