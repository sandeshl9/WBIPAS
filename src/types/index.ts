/**
 * Core Type Definitions for WBIPAS
 * All database entities and business logic types
 */

// ============================================================================
// Database Enums
// ============================================================================

export type ProjectStatus = 
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'on_hold'

export type ProjectPriority = 
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent'

export type ProjectSource = 
  | 'manual'
  | 'opening_balance'
  | 'api'
  | 'import'

export type AuditAction = 
  | 'login'
  | 'logout'
  | 'create_associate'
  | 'update_associate'
  | 'delete_associate'
  | 'disable_associate'
  | 'enable_associate'
  | 'create_project'
  | 'update_project'
  | 'assign_project'
  | 'complete_project'
  | 'cancel_project'
  | 'update_capacity'
  | 'import_opening_balance'
  | 'delete_import'
  | 'update_settings'
  | 'override_recommendation'

// ============================================================================
// User & Authentication
// ============================================================================

export interface User {
  id: string
  email: string
  full_name: string
  role: string
  created_at: string
  updated_at: string
}

// ============================================================================
// Associate
// ============================================================================

export interface Associate {
  id: string
  employee_id: string
  name: string
  email: string
  weekly_capacity: number
  department?: string
  skills?: string[]
  is_available: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string
}

export interface AssociateWithWorkload extends Associate {
  current_workload: number
  available_capacity: number
  utilization_percentage: number
}

// ============================================================================
// Capacity Management
// ============================================================================

export interface Capacity {
  id: string
  associate_id: string
  week_number: number
  year: number
  weekly_capacity: number
  created_at: string
  updated_at: string
}

// ============================================================================
// Project
// ============================================================================

export interface Project {
  id: string
  project_id: string
  project_name: string
  client: string
  project_date: string
  week_number: number
  year: number
  priority: ProjectPriority
  status: ProjectStatus
  comments?: string
  assigned_associate_id?: string
  assigned_associate_name?: string
  completion_date?: string
  source: ProjectSource
  created_by: string
  created_at: string
  updated_at: string
}

export interface ProjectWithDetails extends Project {
  associate?: Associate
}

// ============================================================================
// Assignment & Recommendation
// ============================================================================

export interface Assignment {
  id: string
  project_id: string
  associate_id: string
  assigned_by: string
  assigned_at: string
  recommended_associate_id?: string
  override_reason?: string
  is_override: boolean
}

export interface Recommendation {
  id: string
  project_id: string
  recommended_associate_id: string
  recommended_associate_name: string
  workload_before: number
  workload_after: number
  explanation: string
  was_accepted: boolean
  actual_assigned_associate_id?: string
  created_at: string
}

export interface RecommendationResult {
  associate: Associate
  explanation: string
  workload_before: number
  workload_after: number
  reason: string
}

// ============================================================================
// Opening Balance
// ============================================================================

export interface OpeningBalance {
  id: string
  project_id: string
  project_name: string
  client: string
  project_date: string
  week_number: number
  year: number
  assigned_associate_id: string
  imported_by: string
  imported_at: string
  import_batch_id: string
}

export interface OpeningBalanceImportLog {
  id: string
  batch_id: string
  total_records: number
  successful_imports: number
  failed_imports: number
  errors?: string[]
  imported_by: string
  imported_at: string
}

// ============================================================================
// Audit Log
// ============================================================================

export interface AuditLog {
  id: string
  user_id: string
  user_email: string
  action: AuditAction
  entity_type: string
  entity_id?: string
  old_value?: Record<string, any>
  new_value?: Record<string, any>
  metadata?: Record<string, any>
  ip_address?: string
  created_at: string
}

// ============================================================================
// Settings
// ============================================================================

export interface Settings {
  id: string
  organization_name: string
  week_start_day: number // 0 = Sunday, 1 = Monday
  default_weekly_capacity: number
  enable_ai_recommendations: boolean
  enable_email_notifications: boolean
  theme: 'light' | 'dark' | 'system'
  created_at: string
  updated_at: string
}

// ============================================================================
// Dashboard & Analytics
// ============================================================================

export interface DashboardStats {
  total_associates: number
  active_associates: number
  total_projects: number
  active_projects: number
  completed_projects: number
  available_capacity: number
  weekly_utilization: number
}

export interface AssociateUtilization {
  associate_id: string
  associate_name: string
  assigned_projects: number
  weekly_capacity: number
  utilization_percentage: number
  status: 'underutilized' | 'optimal' | 'overloaded'
}

export interface WeeklyData {
  week_number: number
  year: number
  total_projects: number
  completed_projects: number
  active_projects: number
  total_capacity: number
  used_capacity: number
  utilization_percentage: number
}

// ============================================================================
// Reports
// ============================================================================

export interface UtilizationReport {
  associate_id: string
  associate_name: string
  total_assigned: number
  completed: number
  in_progress: number
  weekly_capacity: number
  utilization: number
}

export interface ProjectTrendReport {
  period: string
  total_projects: number
  completed_projects: number
  cancelled_projects: number
  average_completion_time: number
}

export interface CapacityReport {
  week_number: number
  year: number
  total_capacity: number
  used_capacity: number
  available_capacity: number
  utilization_percentage: number
}

// ============================================================================
// Form Inputs
// ============================================================================

export interface CreateAssociateInput {
  employee_id: string
  name: string
  email: string
  weekly_capacity: number
  department?: string
  skills?: string[]
}

export interface UpdateAssociateInput extends Partial<CreateAssociateInput> {
  is_available?: boolean
  is_active?: boolean
}

export interface CreateProjectInput {
  project_id: string
  project_name: string
  client: string
  project_date: string
  priority: ProjectPriority
  comments?: string
}

export interface AssignProjectInput {
  project_id: string
  associate_id: string
  override_reason?: string
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

// ============================================================================
// Filter & Search Types
// ============================================================================

export interface ProjectFilters {
  status?: ProjectStatus[]
  priority?: ProjectPriority[]
  assigned_associate_id?: string
  client?: string
  week_number?: number
  year?: number
  date_from?: string
  date_to?: string
  search?: string
}

export interface AssociateFilters {
  is_active?: boolean
  is_available?: boolean
  department?: string
  min_capacity?: number
  max_capacity?: number
  search?: string
}
