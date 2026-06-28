-- ============================================================================
-- Seed Data for Development and Testing
-- WBIPAS - Workload Balancing & Intelligent Project Assignment System
-- ============================================================================

-- NOTE: This is for development/testing only
-- Do NOT run this in production

-- ============================================================================
-- Insert Test Users (These will need to match auth.users)
-- ============================================================================

-- Note: In production, users are created via Supabase Auth
-- This is a template for what user records look like

-- INSERT INTO public.users (id, email, full_name, role) VALUES
-- ('user-uuid-1', 'manager@example.com', 'John Manager', 'manager'),
-- ('user-uuid-2', 'supervisor@example.com', 'Jane Supervisor', 'supervisor');

-- ============================================================================
-- Insert Sample Associates
-- ============================================================================

-- Note: Replace 'user-uuid-1' with actual authenticated user ID

-- INSERT INTO public.associates (
--   employee_id, name, email, weekly_capacity, department, is_available, is_active, created_by
-- ) VALUES
-- ('EMP001', 'Alice Anderson', 'alice@example.com', 5, 'Engineering', TRUE, TRUE, 'user-uuid-1'),
-- ('EMP002', 'Bob Brown', 'bob@example.com', 5, 'Engineering', TRUE, TRUE, 'user-uuid-1'),
-- ('EMP003', 'Charlie Chen', 'charlie@example.com', 5, 'Engineering', TRUE, TRUE, 'user-uuid-1'),
-- ('EMP004', 'Diana Davis', 'diana@example.com', 7, 'Engineering', TRUE, TRUE, 'user-uuid-1'),
-- ('EMP005', 'Eve Evans', 'eve@example.com', 5, 'Quality', TRUE, TRUE, 'user-uuid-1'),
-- ('EMP006', 'Frank Foster', 'frank@example.com', 3, 'Quality', TRUE, TRUE, 'user-uuid-1'),
-- ('EMP007', 'Grace Green', 'grace@example.com', 5, 'Operations', TRUE, TRUE, 'user-uuid-1'),
-- ('EMP008', 'Henry Hill', 'henry@example.com', 5, 'Operations', TRUE, TRUE, 'user-uuid-1'),
-- ('EMP009', 'Iris Ivanov', 'iris@example.com', 5, 'Engineering', FALSE, TRUE, 'user-uuid-1'),
-- ('EMP010', 'Jack Johnson', 'jack@example.com', 5, 'Engineering', TRUE, FALSE, 'user-uuid-1');

-- ============================================================================
-- Insert Sample Projects
-- ============================================================================

-- Sample pending projects

-- INSERT INTO public.projects (
--   project_id, project_name, client, project_date, priority, status, created_by
-- ) VALUES
-- ('PRJ001', 'Website Redesign', 'Acme Corp', '2024-06-15', 'high', 'pending', 'user-uuid-1'),
-- ('PRJ002', 'Mobile App Development', 'TechStart Inc', '2024-06-16', 'urgent', 'pending', 'user-uuid-1'),
-- ('PRJ003', 'Database Migration', 'Global Systems', '2024-06-17', 'medium', 'pending', 'user-uuid-1'),
-- ('PRJ004', 'API Integration', 'CloudCo', '2024-06-18', 'low', 'pending', 'user-uuid-1'),
-- ('PRJ005', 'Security Audit', 'SecureNet', '2024-06-19', 'urgent', 'pending', 'user-uuid-1');

-- ============================================================================
-- Comments
-- ============================================================================

-- To use this seed data:
-- 1. Create a user via Supabase Auth
-- 2. Get the user's UUID from auth.users
-- 3. Replace 'user-uuid-1' with the actual UUID
-- 4. Uncomment the INSERT statements
-- 5. Run the migration

-- For testing the recommendation engine:
-- 1. Ensure associates have different workloads
-- 2. Create projects with various dates and priorities
-- 3. Test capacity constraints
-- 4. Test FIFO tie-breaking

-- ============================================================================
-- Helper Query to View Current State
-- ============================================================================

-- SELECT 'Associates' as table_name, COUNT(*) as count FROM public.associates
-- UNION ALL
-- SELECT 'Projects', COUNT(*) FROM public.projects
-- UNION ALL
-- SELECT 'Assignments', COUNT(*) FROM public.assignments
-- UNION ALL
-- SELECT 'Recommendations', COUNT(*) FROM public.recommendations
-- UNION ALL
-- SELECT 'Capacities', COUNT(*) FROM public.capacities
-- UNION ALL
-- SELECT 'Opening Balance', COUNT(*) FROM public.opening_balance
-- UNION ALL
-- SELECT 'Audit Logs', COUNT(*) FROM public.audit_logs;

-- ============================================================================
-- END OF SEED DATA
-- ============================================================================
