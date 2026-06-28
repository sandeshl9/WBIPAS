-- =====================================================
-- WBIPAS - Database Views and Functions
-- Optimized for Dashboard KPIs and Reports
-- =====================================================

-- =====================================================
-- VIEW: current_workload_view
-- Real-time active workload per associate
-- =====================================================
CREATE OR REPLACE VIEW current_workload_view AS
SELECT
  a.id AS associate_id,
  a.employee_code,
  a.name AS associate_name,
  a.email,
  a.default_weekly_capacity,
  a.availability_status,
  a.is_active,
  COUNT(DISTINCT CASE 
    WHEN p.status IN ('pending', 'assigned', 'in_progress', 'on_hold') 
    AND asn.is_current = true
    THEN p.id 
  END) AS active_workload,
  a.default_weekly_capacity - COUNT(DISTINCT CASE 
    WHEN p.status IN ('pending', 'assigned', 'in_progress', 'on_hold') 
    AND asn.is_current = true
    THEN p.id 
  END) AS remaining_capacity,
  MIN(CASE 
    WHEN p.status IN ('pending', 'assigned', 'in_progress', 'on_hold') 
    AND asn.is_current = true
    THEN p.project_date 
  END) AS oldest_active_project_date,
  ROUND(
    (COUNT(DISTINCT CASE 
      WHEN p.status IN ('pending', 'assigned', 'in_progress', 'on_hold') 
      AND asn.is_current = true
      THEN p.id 
    END)::numeric / NULLIF(a.default_weekly_capacity, 0)) * 100,
    2
  ) AS utilization_percentage
FROM associates a
LEFT JOIN assignments asn ON a.id = asn.associate_id AND asn.is_current = true
LEFT JOIN projects p ON asn.project_id = p.id
WHERE a.is_active = true
GROUP BY a.id, a.employee_code, a.name, a.email, a.default_weekly_capacity, a.availability_status, a.is_active;

COMMENT ON VIEW current_workload_view IS 'Real-time workload calculation for all active associates';

-- =====================================================
-- VIEW: weekly_capacity_view
-- Get capacity for specific week/year (with history)
-- =====================================================
CREATE OR REPLACE VIEW weekly_capacity_view AS
SELECT
  a.id AS associate_id,
  a.name AS associate_name,
  COALESCE(ch.week_number, EXTRACT(WEEK FROM CURRENT_DATE)::INTEGER) AS week_number,
  COALESCE(ch.year, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER) AS year,
  COALESCE(ch.weekly_capacity, a.default_weekly_capacity) AS weekly_capacity,
  COUNT(DISTINCT CASE 
    WHEN p.status IN ('pending', 'assigned', 'in_progress', 'on_hold')
    AND p.week_number = COALESCE(ch.week_number, EXTRACT(WEEK FROM CURRENT_DATE)::INTEGER)
    AND p.year = COALESCE(ch.year, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER)
    AND asn.is_current = true
    THEN p.id 
  END) AS weekly_assigned_count,
  COALESCE(ch.weekly_capacity, a.default_weekly_capacity) - COUNT(DISTINCT CASE 
    WHEN p.status IN ('pending', 'assigned', 'in_progress', 'on_hold')
    AND p.week_number = COALESCE(ch.week_number, EXTRACT(WEEK FROM CURRENT_DATE)::INTEGER)
    AND p.year = COALESCE(ch.year, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER)
    AND asn.is_current = true
    THEN p.id 
  END) AS weekly_remaining_capacity
FROM associates a
LEFT JOIN capacity_history ch ON a.id = ch.associate_id
LEFT JOIN assignments asn ON a.id = asn.associate_id AND asn.is_current = true
LEFT JOIN projects p ON asn.project_id = p.id
WHERE a.is_active = true
GROUP BY a.id, a.name, ch.week_number, ch.year, ch.weekly_capacity, a.default_weekly_capacity;

COMMENT ON VIEW weekly_capacity_view IS 'Weekly capacity with historical support for fairness calculations';

-- =====================================================
-- VIEW: dashboard_kpis_view
-- Single view for all dashboard KPIs
-- =====================================================
CREATE OR REPLACE VIEW dashboard_kpis_view AS
SELECT
  (SELECT COUNT(*) FROM associates WHERE is_active = true) AS total_associates,
  (SELECT COUNT(*) FROM associates WHERE is_active = true AND availability_status = 'available') AS active_associates,
  (SELECT COUNT(*) FROM projects) AS total_projects,
  (SELECT COUNT(*) FROM projects WHERE status IN ('pending', 'assigned', 'in_progress', 'on_hold')) AS active_projects,
  (SELECT COUNT(*) FROM projects WHERE status = 'completed') AS completed_projects,
  (SELECT COUNT(*) FROM projects WHERE DATE(created_at) = CURRENT_DATE) AS assigned_today,
  (SELECT SUM(default_weekly_capacity) - SUM(active_workload) 
   FROM current_workload_view) AS remaining_capacity,
  (SELECT ROUND(AVG(utilization_percentage), 2) 
   FROM current_workload_view) AS avg_utilization,
  (SELECT ROUND(AVG(active_workload::numeric), 2) 
   FROM current_workload_view) AS avg_workload,
  (SELECT COUNT(*) FROM current_workload_view 
   WHERE utilization_percentage >= 80) AS busy_associates,
  (SELECT COUNT(*) FROM current_workload_view 
   WHERE active_workload = 0) AS idle_associates;

COMMENT ON VIEW dashboard_kpis_view IS 'Pre-calculated KPIs for dashboard performance';

-- =====================================================
-- VIEW: associate_utilization_view
-- Detailed utilization for reports
-- =====================================================
CREATE OR REPLACE VIEW associate_utilization_view AS
SELECT
  a.id AS associate_id,
  a.employee_code,
  a.name AS associate_name,
  a.email,
  a.department,
  a.designation,
  a.default_weekly_capacity AS capacity,
  cw.active_workload,
  cw.remaining_capacity,
  cw.utilization_percentage,
  cw.oldest_active_project_date AS fifo_date,
  COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'completed') AS completed_projects,
  COUNT(DISTINCT p.id) FILTER (WHERE p.status IN ('pending', 'assigned', 'in_progress', 'on_hold')) AS active_projects_count
FROM associates a
LEFT JOIN current_workload_view cw ON a.id = cw.associate_id
LEFT JOIN assignments asn ON a.id = asn.associate_id
LEFT JOIN projects p ON asn.project_id = p.id
WHERE a.is_active = true
GROUP BY a.id, a.employee_code, a.name, a.email, a.department, a.designation, 
         a.default_weekly_capacity, cw.active_workload, cw.remaining_capacity, 
         cw.utilization_percentage, cw.oldest_active_project_date;

COMMENT ON VIEW associate_utilization_view IS 'Complete utilization metrics for reporting';

-- =====================================================
-- FUNCTION: get_recommendation_candidates
-- Returns eligible associates for recommendation
-- =====================================================
CREATE OR REPLACE FUNCTION get_recommendation_candidates(
  p_week_number INTEGER,
  p_year INTEGER
)
RETURNS TABLE (
  associate_id UUID,
  associate_name TEXT,
  employee_code TEXT,
  weekly_capacity INTEGER,
  weekly_assigned_count INTEGER,
  active_workload BIGINT,
  oldest_active_project_date DATE,
  utilization_percentage NUMERIC,
  is_eligible BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.name,
    a.employee_code,
    COALESCE(ch.weekly_capacity, a.default_weekly_capacity) AS weekly_capacity,
    COUNT(DISTINCT CASE 
      WHEN p.week_number = p_week_number 
      AND p.year = p_year
      AND p.status IN ('pending', 'assigned', 'in_progress', 'on_hold')
      AND asn.is_current = true
      THEN p.id 
    END)::INTEGER AS weekly_assigned_count,
    COUNT(DISTINCT CASE 
      WHEN p.status IN ('pending', 'assigned', 'in_progress', 'on_hold')
      AND asn.is_current = true
      THEN p.id 
    END) AS active_workload,
    MIN(CASE 
      WHEN p.status IN ('pending', 'assigned', 'in_progress', 'on_hold')
      AND asn.is_current = true
      THEN p.project_date 
    END) AS oldest_active_project_date,
    ROUND(
      (COUNT(DISTINCT CASE 
        WHEN p.status IN ('pending', 'assigned', 'in_progress', 'on_hold')
        AND asn.is_current = true
        THEN p.id 
      END)::numeric / NULLIF(COALESCE(ch.weekly_capacity, a.default_weekly_capacity), 0)) * 100,
      2
    ) AS utilization_percentage,
    (
      a.is_active = true
      AND a.availability_status = 'available'
      AND COUNT(DISTINCT CASE 
        WHEN p.week_number = p_week_number 
        AND p.year = p_year
        AND p.status IN ('pending', 'assigned', 'in_progress', 'on_hold')
        AND asn.is_current = true
        THEN p.id 
      END) < COALESCE(ch.weekly_capacity, a.default_weekly_capacity)
    ) AS is_eligible
  FROM associates a
  LEFT JOIN capacity_history ch ON a.id = ch.associate_id 
    AND ch.week_number = p_week_number 
    AND ch.year = p_year
  LEFT JOIN assignments asn ON a.id = asn.associate_id AND asn.is_current = true
  LEFT JOIN projects p ON asn.project_id = p.id
  GROUP BY a.id, a.name, a.employee_code, a.default_weekly_capacity, 
           a.is_active, a.availability_status, ch.weekly_capacity
  HAVING (
    a.is_active = true
    AND a.availability_status = 'available'
    AND COUNT(DISTINCT CASE 
      WHEN p.week_number = p_week_number 
      AND p.year = p_year
      AND p.status IN ('pending', 'assigned', 'in_progress', 'on_hold')
      AND asn.is_current = true
      THEN p.id 
    END) < COALESCE(ch.weekly_capacity, a.default_weekly_capacity)
  )
  ORDER BY 
    COUNT(DISTINCT CASE 
      WHEN p.status IN ('pending', 'assigned', 'in_progress', 'on_hold')
      AND asn.is_current = true
      THEN p.id 
    END) ASC,
    MIN(CASE 
      WHEN p.status IN ('pending', 'assigned', 'in_progress', 'on_hold')
      AND asn.is_current = true
      THEN p.project_date 
    END) ASC NULLS LAST,
    a.name ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_recommendation_candidates IS 'Returns eligible associates ranked by recommendation rules';

-- =====================================================
-- FUNCTION: assign_project
-- Transactional project assignment
-- =====================================================
CREATE OR REPLACE FUNCTION assign_project(
  p_project_id UUID,
  p_associate_id UUID,
  p_recommendation_log JSONB,
  p_was_overridden BOOLEAN DEFAULT false,
  p_override_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_assignment_id UUID;
  v_recommendation_id UUID;
  v_result JSONB;
BEGIN
  -- Start transaction (implicit in function)
  
  -- 1. Create assignment
  INSERT INTO assignments (project_id, associate_id, is_current, assigned_by, assignment_reason)
  VALUES (p_project_id, p_associate_id, true, auth.uid(), 
          CASE WHEN p_was_overridden THEN p_override_reason ELSE 'recommendation_accepted' END)
  RETURNING id INTO v_assignment_id;
  
  -- 2. Update project status
  UPDATE projects
  SET status = 'assigned', updated_at = NOW()
  WHERE id = p_project_id;
  
  -- 3. Create recommendation log
  INSERT INTO recommendation_logs (
    project_id,
    recommended_associate_id,
    assigned_associate_id,
    recommendation_reason,
    top_candidates,
    was_overridden,
    override_reason,
    created_by
  )
  VALUES (
    p_project_id,
    (p_recommendation_log->>'recommended_associate_id')::UUID,
    p_associate_id,
    p_recommendation_log->'reason',
    p_recommendation_log->'top_candidates',
    p_was_overridden,
    p_override_reason,
    auth.uid()
  )
  RETURNING id INTO v_recommendation_id;
  
  -- 4. Create audit log
  INSERT INTO audit_logs (entity_type, entity_id, action, new_values, performed_by)
  VALUES (
    'assignment',
    v_assignment_id,
    'assign',
    jsonb_build_object(
      'project_id', p_project_id,
      'associate_id', p_associate_id,
      'was_overridden', p_was_overridden
    ),
    auth.uid()
  );
  
  -- 5. Return result
  v_result := jsonb_build_object(
    'success', true,
    'assignment_id', v_assignment_id,
    'recommendation_id', v_recommendation_id,
    'project_id', p_project_id,
    'associate_id', p_associate_id
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback is automatic in PostgreSQL
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION assign_project IS 'Transactional project assignment with audit trail';

-- =====================================================
-- FUNCTION: reassign_project
-- Reassign project to different associate
-- =====================================================
CREATE OR REPLACE FUNCTION reassign_project(
  p_project_id UUID,
  p_new_associate_id UUID,
  p_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_old_assignment_id UUID;
  v_new_assignment_id UUID;
  v_result JSONB;
BEGIN
  -- 1. End current assignment
  UPDATE assignments
  SET is_current = false, ended_at = NOW()
  WHERE project_id = p_project_id AND is_current = true
  RETURNING id INTO v_old_assignment_id;
  
  -- 2. Create new assignment
  INSERT INTO assignments (project_id, associate_id, is_current, assigned_by, assignment_reason)
  VALUES (p_project_id, p_new_associate_id, true, auth.uid(), p_reason)
  RETURNING id INTO v_new_assignment_id;
  
  -- 3. Create audit log
  INSERT INTO audit_logs (entity_type, entity_id, action, new_values, performed_by)
  VALUES (
    'assignment',
    v_new_assignment_id,
    'reassign',
    jsonb_build_object(
      'project_id', p_project_id,
      'old_assignment_id', v_old_assignment_id,
      'new_associate_id', p_new_associate_id,
      'reason', p_reason
    ),
    auth.uid()
  );
  
  -- 4. Return result
  v_result := jsonb_build_object(
    'success', true,
    'old_assignment_id', v_old_assignment_id,
    'new_assignment_id', v_new_assignment_id
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION reassign_project IS 'Reassign project with complete history preservation';

-- =====================================================
-- FUNCTION: complete_project
-- Mark project as completed
-- =====================================================
CREATE OR REPLACE FUNCTION complete_project(
  p_project_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- 1. Update project status
  UPDATE projects
  SET status = 'completed', completed_at = NOW(), updated_at = NOW()
  WHERE id = p_project_id;
  
  -- 2. Create audit log
  INSERT INTO audit_logs (entity_type, entity_id, action, performed_by)
  VALUES ('project', p_project_id, 'complete', auth.uid());
  
  -- 3. Create activity log
  INSERT INTO activity_logs (activity_type, description, metadata, user_id)
  SELECT 
    'project_completed',
    'Project ' || p.project_name || ' completed',
    jsonb_build_object('project_id', p.id, 'client', p.client_name),
    auth.uid()
  FROM projects p
  WHERE p.id = p_project_id;
  
  -- 4. Return result
  v_result := jsonb_build_object(
    'success', true,
    'project_id', p_project_id,
    'completed_at', NOW()
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION complete_project IS 'Mark project as completed with audit trail';

-- =====================================================
-- FUNCTION: get_weekly_timeline
-- Get associate workload timeline for next N weeks
-- =====================================================
CREATE OR REPLACE FUNCTION get_weekly_timeline(
  p_weeks_ahead INTEGER DEFAULT 12
)
RETURNS TABLE (
  associate_id UUID,
  associate_name TEXT,
  week_number INTEGER,
  year INTEGER,
  capacity INTEGER,
  assigned_count INTEGER,
  utilization_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH weeks AS (
    SELECT 
      EXTRACT(WEEK FROM d)::INTEGER AS week_number,
      EXTRACT(YEAR FROM d)::INTEGER AS year
    FROM generate_series(
      CURRENT_DATE,
      CURRENT_DATE + (p_weeks_ahead || ' weeks')::INTERVAL,
      '1 week'::INTERVAL
    ) AS d
  )
  SELECT
    a.id,
    a.name,
    w.week_number,
    w.year,
    COALESCE(ch.weekly_capacity, a.default_weekly_capacity) AS capacity,
    COUNT(DISTINCT p.id)::INTEGER AS assigned_count,
    ROUND(
      (COUNT(DISTINCT p.id)::numeric / NULLIF(COALESCE(ch.weekly_capacity, a.default_weekly_capacity), 0)) * 100,
      2
    ) AS utilization_percentage
  FROM associates a
  CROSS JOIN weeks w
  LEFT JOIN capacity_history ch ON a.id = ch.associate_id 
    AND ch.week_number = w.week_number 
    AND ch.year = w.year
  LEFT JOIN assignments asn ON a.id = asn.associate_id AND asn.is_current = true
  LEFT JOIN projects p ON asn.project_id = p.id
    AND p.week_number = w.week_number
    AND p.year = w.year
    AND p.status IN ('pending', 'assigned', 'in_progress', 'on_hold')
  WHERE a.is_active = true
  GROUP BY a.id, a.name, w.week_number, w.year, ch.weekly_capacity, a.default_weekly_capacity
  ORDER BY a.name, w.week_number;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_weekly_timeline IS 'Forward-looking capacity timeline (MASTER PROMPT ENHANCEMENT)';
