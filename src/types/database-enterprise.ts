/**
 * Enterprise Database Type Definitions
 * Generated from Volume 3 Enterprise Schema
 * Version: 2.0.0
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================================================
// ENUMS
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
  | 'bulk_assignment' // NEW

export type AvailabilityStatus = 
  | 'available'
  | 'leave'
  | 'training'
  | 'holiday'
  | 'inactive'

export type ImportType = 
  | 'opening_balance'
  | 'projects'
  | 'associates'
  | 'capacity'

export type UserRole = 
  | 'manager'
  | 'admin'
  | 'supervisor'
  | 'viewer'

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
// DATABASE INTERFACE
// ============================================================================

export interface Database {
  public: {
    Tables: {
      // ======================================================================
      // PROFILES (renamed from users)
      // ======================================================================
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          role: UserRole
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          role?: UserRole
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          role?: UserRole
          avatar_url?: string | null
          is_active?: boolean
          updated_at?: string
        }
      }

      // ======================================================================
      // ASSOCIATES
      // ======================================================================
      associates: {
        Row: {
          id: string
          employee_code: string // RENAMED from employee_id
          name: string
          email: string
          weekly_capacity: number
          department: string | null
          designation: string | null // NEW
          skills: string[] | null
          availability_status: AvailabilityStatus // NEW (replaces is_available)
          is_available: boolean // DEPRECATED - use availability_status
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          employee_code: string
          name: string
          email: string
          weekly_capacity?: number
          department?: string | null
          designation?: string | null
          skills?: string[] | null
          availability_status?: AvailabilityStatus
          is_available?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          employee_code?: string
          name?: string
          email?: string
          weekly_capacity?: number
          department?: string | null
          designation?: string | null
          skills?: string[] | null
          availability_status?: AvailabilityStatus
          is_available?: boolean
          is_active?: boolean
          updated_at?: string
        }
      }


      // ======================================================================
      // CAPACITY_HISTORY (replaces capacities)
      // ======================================================================
      capacity_history: {
        Row: {
          id: string
          associate_id: string
          week_number: number
          year: number
          capacity: number
          effective_from: string // DATE
          effective_to: string | null // DATE
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          associate_id: string
          week_number: number
          year: number
          capacity: number
          effective_from: string
          effective_to?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          // Capacity history is IMMUTABLE - no updates allowed
        }
      }

      // ======================================================================
      // PROJECTS
      // ======================================================================
      projects: {
        Row: {
          id: string
          project_code: string // NEW
          project_id: string
          project_name: string
          client: string
          project_date: string // DATE
          week_number: number
          year: number
          priority: ProjectPriority
          status: ProjectStatus
          comments: string | null
          assigned_associate_id: string | null
          assigned_associate_name: string | null
          completion_date: string | null
          source: ProjectSource
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_code: string
          project_id: string
          project_name: string
          client: string
          project_date: string
          week_number: number
          year: number
          priority?: ProjectPriority
          status?: ProjectStatus
          comments?: string | null
          assigned_associate_id?: string | null
          assigned_associate_name?: string | null
          completion_date?: string | null
          source?: ProjectSource
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          project_code?: string
          project_id?: string
          project_name?: string
          client?: string
          project_date?: string
          priority?: ProjectPriority
          status?: ProjectStatus
          comments?: string | null
          assigned_associate_id?: string | null
          assigned_associate_name?: string | null
          completion_date?: string | null
          source?: ProjectSource
          updated_at?: string
        }
      }


      // ======================================================================
      // ASSIGNMENTS
      // ======================================================================
      assignments: {
        Row: {
          id: string
          project_id: string
          associate_id: string
          assigned_by: string
          assigned_at: string
          recommended_associate_id: string | null
          override_reason: string | null
          is_override: boolean
          assignment_engine_version: string // NEW
          recommendation_id: string | null // NEW
        }
        Insert: {
          id?: string
          project_id: string
          associate_id: string
          assigned_by: string
          assigned_at?: string
          recommended_associate_id?: string | null
          override_reason?: string | null
          is_override?: boolean
          assignment_engine_version?: string
          recommendation_id?: string | null
        }
        Update: {
          override_reason?: string | null
          is_override?: boolean
        }
      }

      // ======================================================================
      // RECOMMENDATION_LOGS (replaces recommendations)
      // ======================================================================
      recommendation_logs: {
        Row: {
          id: string
          project_id: string
          recommended_associate: string
          recommended_rank: number // NEW
          recommendation_reason: string
          workload: number
          capacity: number // NEW
          fifo_date: string | null // NEW
          algorithm_version: string // NEW
          accepted: boolean
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          recommended_associate: string
          recommended_rank?: number
          recommendation_reason: string
          workload?: number
          capacity?: number
          fifo_date?: string | null
          algorithm_version?: string
          accepted?: boolean
          created_at?: string
        }
        Update: {
          accepted?: boolean
        }
      }


      // ======================================================================
      // HOLIDAYS (NEW)
      // ======================================================================
      holidays: {
        Row: {
          id: string
          holiday_name: string
          holiday_date: string // DATE
          country: string | null
          state: string | null
          created_at: string
        }
        Insert: {
          id?: string
          holiday_name: string
          holiday_date: string
          country?: string | null
          state?: string | null
          created_at?: string
        }
        Update: {
          holiday_name?: string
          holiday_date?: string
          country?: string | null
          state?: string | null
        }
      }

      // ======================================================================
      // IMPORT_HISTORY (consolidates opening_balance tables)
      // ======================================================================
      import_history: {
        Row: {
          id: string
          file_name: string
          import_type: ImportType
          records: number
          success_count: number
          failed_count: number
          imported_by: string
          created_at: string
        }
        Insert: {
          id?: string
          file_name: string
          import_type: ImportType
          records?: number
          success_count?: number
          failed_count?: number
          imported_by: string
          created_at?: string
        }
        Update: {
          // Import history is typically immutable
        }
      }

      // ======================================================================
      // ACTIVITY_LOGS (NEW)
      // ======================================================================
      activity_logs: {
        Row: {
          id: string
          title: string
          description: string
          icon: string | null
          entity: string | null
          entity_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          icon?: string | null
          entity?: string | null
          entity_id?: string | null
          created_at?: string
        }
        Update: {
          // Activity logs are typically immutable
        }
      }


      // ======================================================================
      // NOTIFICATIONS (NEW - Future Ready)
      // ======================================================================
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          is_read: boolean
          type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          is_read?: boolean
          type?: string | null
          created_at?: string
        }
        Update: {
          is_read?: boolean
        }
      }

      // ======================================================================
      // AUDIT_LOGS
      // ======================================================================
      audit_logs: {
        Row: {
          id: string
          user_id: string
          user_email: string
          action: AuditAction
          entity_type: string
          entity_id: string | null
          old_value: Json | null
          new_value: Json | null
          metadata: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          user_email: string
          action: AuditAction
          entity_type: string
          entity_id?: string | null
          old_value?: Json | null
          new_value?: Json | null
          metadata?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          // Audit logs are immutable
        }
      }

      // ======================================================================
      // SETTINGS
      // ======================================================================
      settings: {
        Row: {
          id: string
          organization_name: string
          week_start_day: number
          default_weekly_capacity: number
          enable_ai_recommendations: boolean
          enable_email_notifications: boolean
          fifo_enabled: boolean // NEW
          capacity_rule: string // NEW
          theme: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_name?: string
          week_start_day?: number
          default_weekly_capacity?: number
          enable_ai_recommendations?: boolean
          enable_email_notifications?: boolean
          fifo_enabled?: boolean
          capacity_rule?: string
          theme?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          organization_name?: string
          week_start_day?: number
          default_weekly_capacity?: number
          enable_ai_recommendations?: boolean
          enable_email_notifications?: boolean
          fifo_enabled?: boolean
          capacity_rule?: string
          theme?: string
          updated_at?: string
        }
      }

      // ======================================================================
      // OPENING_BALANCE (kept for backwards compatibility)
      // ======================================================================
      opening_balance: {
        Row: {
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
        Insert: {
          id?: string
          project_id: string
          project_name: string
          client: string
          project_date: string
          week_number: number
          year: number
          assigned_associate_id: string
          imported_by: string
          imported_at?: string
          import_batch_id: string
        }
        Update: {
          // Opening balance is immutable
        }
      }
    }


    Views: {
      // ======================================================================
      // v_current_workload
      // ======================================================================
      v_current_workload: {
        Row: {
          associate_id: string
          active_project_count: number
          opening_balance_count: number
          assigned_project_count: number
        }
      }

      // ======================================================================
      // v_weekly_capacity
      // ======================================================================
      v_weekly_capacity: {
        Row: {
          associate_id: string
          associate_name: string
          employee_code: string
          current_week: number
          current_year: number
          weekly_capacity: number
          assigned_count: number
          remaining_capacity: number
          utilization_percentage: number
          is_active: boolean
          availability_status: AvailabilityStatus
        }
      }

      // ======================================================================
      // v_dashboard_kpis
      // ======================================================================
      v_dashboard_kpis: {
        Row: {
          total_associates: number
          available_associates: number
          associates_with_workload: number
          total_projects: number
          active_projects: number
          completed_projects: number
          pending_projects: number
          total_capacity: number
          total_workload: number
          available_capacity: number
          average_utilization: number
          over_capacity_count: number
          idle_count: number
          projects_created_today: number
          assignments_today: number
          completions_today: number
        }
      }

      // ======================================================================
      // v_associates_with_workload (legacy view)
      // ======================================================================
      v_associates_with_workload: {
        Row: {
          id: string
          employee_id: string
          name: string
          email: string
          weekly_capacity: number
          department: string | null
          skills: string[] | null
          is_available: boolean
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string
          current_workload: number
          available_capacity: number
          utilization_percentage: number
        }
      }
    }


    Functions: {
      // ======================================================================
      // CORE WORKLOAD FUNCTIONS
      // ======================================================================
      get_associate_workload: {
        Args: {
          p_associate_id: string
          p_week_number: number
          p_year: number
        }
        Returns: number
      }

      get_associate_capacity: {
        Args: {
          p_associate_id: string
          p_week_number: number
          p_year: number
        }
        Returns: number
      }

      has_capacity: {
        Args: {
          p_associate_id: string
          p_week_number: number
          p_year: number
        }
        Returns: boolean
      }

      get_oldest_project_date: {
        Args: {
          p_associate_id: string
        }
        Returns: string // DATE
      }

      // ======================================================================
      // ENTERPRISE FUNCTIONS
      // ======================================================================
      assign_project: {
        Args: {
          p_project_id: string
          p_associate_id: string
          p_assigned_by: string
          p_recommendation_id?: string | null
          p_override_reason?: string | null
          p_engine_version?: string
        }
        Returns: Json
      }

      is_associate_available: {
        Args: {
          p_associate_id: string
          p_week_number: number
          p_year: number
        }
        Returns: boolean
      }

      get_dashboard_stats: {
        Args: {}
        Returns: Json
      }

      get_recent_activity: {
        Args: {
          p_limit?: number
        }
        Returns: {
          id: string
          title: string
          description: string
          icon: string | null
          entity: string | null
          entity_id: string | null
          created_at: string
        }[]
      }
    }
  }
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Table types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type Associate = Database['public']['Tables']['associates']['Row']
export type AssociateInsert = Database['public']['Tables']['associates']['Insert']
export type AssociateUpdate = Database['public']['Tables']['associates']['Update']

export type CapacityHistory = Database['public']['Tables']['capacity_history']['Row']
export type CapacityHistoryInsert = Database['public']['Tables']['capacity_history']['Insert']

export type Project = Database['public']['Tables']['projects']['Row']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type ProjectUpdate = Database['public']['Tables']['projects']['Update']

export type Assignment = Database['public']['Tables']['assignments']['Row']
export type AssignmentInsert = Database['public']['Tables']['assignments']['Insert']
export type AssignmentUpdate = Database['public']['Tables']['assignments']['Update']

export type RecommendationLog = Database['public']['Tables']['recommendation_logs']['Row']
export type RecommendationLogInsert = Database['public']['Tables']['recommendation_logs']['Insert']
export type RecommendationLogUpdate = Database['public']['Tables']['recommendation_logs']['Update']

export type Holiday = Database['public']['Tables']['holidays']['Row']
export type HolidayInsert = Database['public']['Tables']['holidays']['Insert']
export type HolidayUpdate = Database['public']['Tables']['holidays']['Update']

export type ImportHistory = Database['public']['Tables']['import_history']['Row']
export type ImportHistoryInsert = Database['public']['Tables']['import_history']['Insert']

export type ActivityLog = Database['public']['Tables']['activity_logs']['Row']
export type ActivityLogInsert = Database['public']['Tables']['activity_logs']['Insert']

export type Notification = Database['public']['Tables']['notifications']['Row']
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update']

export type AuditLog = Database['public']['Tables']['audit_logs']['Row']
export type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert']

export type Settings = Database['public']['Tables']['settings']['Row']
export type SettingsInsert = Database['public']['Tables']['settings']['Insert']
export type SettingsUpdate = Database['public']['Tables']['settings']['Update']

// View types
export type CurrentWorkload = Database['public']['Views']['v_current_workload']['Row']
export type WeeklyCapacity = Database['public']['Views']['v_weekly_capacity']['Row']
export type DashboardKPIs = Database['public']['Views']['v_dashboard_kpis']['Row']

// Function return types
export type AssignProjectResult = Json
export type DashboardStats = Json
export type RecentActivity = Database['public']['Functions']['get_recent_activity']['Returns'][0]

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface AssociateWithWorkload extends Associate {
  current_workload: number
  available_capacity: number
  utilization_percentage: number
}

export interface ProjectWithAssociate extends Project {
  associate?: Associate
}

export interface AssignmentWithDetails extends Assignment {
  project?: Project
  associate?: Associate
  recommended_associate?: Associate
}

export interface RecommendationWithDetails extends RecommendationLog {
  project?: Project
  associate?: Associate
}

