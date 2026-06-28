-- ============================================================================
-- Row Level Security (RLS) Policies
-- WBIPAS - Workload Balancing & Intelligent Project Assignment System
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.associates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capacities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opening_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opening_balance_import_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICIES: users
-- ============================================================================

-- Users can read their own record
CREATE POLICY "Users can view own record"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own record
CREATE POLICY "Users can update own record"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- Managers can view all users (future role-based access)
CREATE POLICY "Managers can view all users"
  ON public.users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- ============================================================================
-- POLICIES: associates
-- ============================================================================

-- Authenticated users can view all associates
CREATE POLICY "Authenticated users can view associates"
  ON public.associates
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Managers can create associates
CREATE POLICY "Managers can create associates"
  ON public.associates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Managers can update associates
CREATE POLICY "Managers can update associates"
  ON public.associates
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Managers can delete associates (soft delete via is_active)
CREATE POLICY "Managers can delete associates"
  ON public.associates
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- ============================================================================
-- POLICIES: capacities
-- ============================================================================

-- Authenticated users can view capacities
CREATE POLICY "Authenticated users can view capacities"
  ON public.capacities
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Managers can insert capacities
CREATE POLICY "Managers can create capacities"
  ON public.capacities
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Managers can update capacities
CREATE POLICY "Managers can update capacities"
  ON public.capacities
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Managers can delete capacities
CREATE POLICY "Managers can delete capacities"
  ON public.capacities
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- ============================================================================
-- POLICIES: projects
-- ============================================================================

-- Authenticated users can view all projects
CREATE POLICY "Authenticated users can view projects"
  ON public.projects
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Managers can create projects
CREATE POLICY "Managers can create projects"
  ON public.projects
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Managers can update projects
CREATE POLICY "Managers can update projects"
  ON public.projects
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Managers can delete projects
CREATE POLICY "Managers can delete projects"
  ON public.projects
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- ============================================================================
-- POLICIES: assignments
-- ============================================================================

-- Authenticated users can view assignments
CREATE POLICY "Authenticated users can view assignments"
  ON public.assignments
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Managers can create assignments
CREATE POLICY "Managers can create assignments"
  ON public.assignments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Managers can update assignments
CREATE POLICY "Managers can update assignments"
  ON public.assignments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- ============================================================================
-- POLICIES: recommendations
-- ============================================================================

-- Authenticated users can view recommendations
CREATE POLICY "Authenticated users can view recommendations"
  ON public.recommendations
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Managers can create recommendations
CREATE POLICY "Managers can create recommendations"
  ON public.recommendations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Managers can update recommendations
CREATE POLICY "Managers can update recommendations"
  ON public.recommendations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- ============================================================================
-- POLICIES: opening_balance
-- ============================================================================

-- Authenticated users can view opening balance
CREATE POLICY "Authenticated users can view opening balance"
  ON public.opening_balance
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Managers can insert opening balance
CREATE POLICY "Managers can create opening balance"
  ON public.opening_balance
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Managers can delete opening balance (for batch deletion)
CREATE POLICY "Managers can delete opening balance"
  ON public.opening_balance
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- ============================================================================
-- POLICIES: opening_balance_import_logs
-- ============================================================================

-- Authenticated users can view import logs
CREATE POLICY "Authenticated users can view import logs"
  ON public.opening_balance_import_logs
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Managers can create import logs
CREATE POLICY "Managers can create import logs"
  ON public.opening_balance_import_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- ============================================================================
-- POLICIES: audit_logs
-- ============================================================================

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (user_id = auth.uid());

-- Managers can view all audit logs
CREATE POLICY "Managers can view all audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- System can insert audit logs (via service role)
CREATE POLICY "System can create audit logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- POLICIES: settings
-- ============================================================================

-- Authenticated users can view settings
CREATE POLICY "Authenticated users can view settings"
  ON public.settings
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Managers can update settings
CREATE POLICY "Managers can update settings"
  ON public.settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS for RLS
-- ============================================================================

-- Function to check if current user is a manager
CREATE OR REPLACE FUNCTION is_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'manager'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if current user is authenticated
CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- GRANTS: Grant appropriate permissions to authenticated users
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant select on all tables to authenticated users (RLS will filter)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant sequence usage
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Users can view own record" ON public.users IS 
  'Allow users to view their own user record';

COMMENT ON POLICY "Managers can view all users" ON public.users IS 
  'Allow managers to view all user records for management purposes';

COMMENT ON POLICY "Authenticated users can view associates" ON public.associates IS 
  'All authenticated users can view associates for assignment purposes';

COMMENT ON POLICY "Managers can create associates" ON public.associates IS 
  'Only managers can create new associates';

COMMENT ON FUNCTION is_manager() IS 
  'Helper function to check if current user has manager role';

COMMENT ON FUNCTION is_authenticated() IS 
  'Helper function to check if user is authenticated';

-- ============================================================================
-- END OF RLS POLICIES
-- ============================================================================
