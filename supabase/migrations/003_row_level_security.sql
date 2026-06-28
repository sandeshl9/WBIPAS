-- =====================================================
-- WBIPAS - Row Level Security (RLS) Policies
-- Enterprise-grade security
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE associates ENABLE ROW LEVEL SECURITY;
ALTER TABLE capacity_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES - Users can view and update their own profile
-- =====================================================
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- =====================================================
-- ASSOCIATES - Managers can manage, viewers can only read
-- =====================================================
CREATE POLICY "Everyone can view associates"
  ON associates FOR SELECT
  USING (true);

CREATE POLICY "Managers can insert associates"
  ON associates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Managers can update associates"
  ON associates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- =====================================================
-- CAPACITY_HISTORY - Managers can manage
-- =====================================================
CREATE POLICY "Everyone can view capacity history"
  ON capacity_history FOR SELECT
  USING (true);

CREATE POLICY "Managers can insert capacity history"
  ON capacity_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- =====================================================
-- PROJECTS - Managers can manage, everyone can view
-- =====================================================
CREATE POLICY "Everyone can view projects"
  ON projects FOR SELECT
  USING (true);

CREATE POLICY "Managers can insert projects"
  ON projects FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Managers can update projects"
  ON projects FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- =====================================================
-- ASSIGNMENTS - Managers can manage, everyone can view
-- =====================================================
CREATE POLICY "Everyone can view assignments"
  ON assignments FOR SELECT
  USING (true);

CREATE POLICY "Managers can insert assignments"
  ON assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Managers can update assignments"
  ON assignments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- =====================================================
-- RECOMMENDATION_LOGS - Everyone can view (audit trail)
-- =====================================================
CREATE POLICY "Everyone can view recommendation logs"
  ON recommendation_logs FOR SELECT
  USING (true);

CREATE POLICY "Managers can insert recommendation logs"
  ON recommendation_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- =====================================================
-- AUDIT_LOGS - Everyone can view (compliance)
-- =====================================================
CREATE POLICY "Everyone can view audit logs"
  ON audit_logs FOR SELECT
  USING (true);

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true); -- Allows triggers to insert

-- =====================================================
-- SETTINGS - Admins only
-- =====================================================
CREATE POLICY "Everyone can view settings"
  ON settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage settings"
  ON settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- =====================================================
-- HOLIDAYS - Admins can manage, everyone can view
-- =====================================================
CREATE POLICY "Everyone can view holidays"
  ON holidays FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage holidays"
  ON holidays FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- =====================================================
-- IMPORT_HISTORY - Everyone can view their imports
-- =====================================================
CREATE POLICY "Everyone can view import history"
  ON import_history FOR SELECT
  USING (true);

CREATE POLICY "Managers can insert import history"
  ON import_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- =====================================================
-- ACTIVITY_LOGS - Everyone can view activity
-- =====================================================
CREATE POLICY "Everyone can view activity logs"
  ON activity_logs FOR SELECT
  USING (true);

CREATE POLICY "System can insert activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (true); -- Allows triggers to insert

-- =====================================================
-- NOTIFICATIONS - Users can view their own notifications
-- =====================================================
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true); -- Allows system to create notifications

-- =====================================================
-- GRANT EXECUTE ON FUNCTIONS
-- =====================================================
GRANT EXECUTE ON FUNCTION get_recommendation_candidates TO authenticated;
GRANT EXECUTE ON FUNCTION assign_project TO authenticated;
GRANT EXECUTE ON FUNCTION reassign_project TO authenticated;
GRANT EXECUTE ON FUNCTION complete_project TO authenticated;
GRANT EXECUTE ON FUNCTION get_weekly_timeline TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON POLICY "Users can view their own profile" ON profiles IS 'Privacy: users only see their own profile';
COMMENT ON POLICY "Everyone can view associates" ON associates IS 'Associates list is public within organization';
COMMENT ON POLICY "Managers can insert associates" ON associates IS 'Only managers can add new associates';
COMMENT ON POLICY "Everyone can view audit logs" ON audit_logs IS 'Full transparency for audit trail';
COMMENT ON POLICY "Admins can manage settings" ON settings IS 'Settings restricted to admins only';
