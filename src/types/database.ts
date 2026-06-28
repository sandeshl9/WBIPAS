/**
 * Database Type Definitions
 * Auto-generated types matching Supabase schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      associates: {
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
        }
        Insert: {
          id?: string
          employee_id: string
          name: string
          email: string
          weekly_capacity?: number
          department?: string | null
          skills?: string[] | null
          is_available?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          employee_id?: string
          name?: string
          email?: string
          weekly_capacity?: number
          department?: string | null
          skills?: string[] | null
          is_available?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
      capacities: {
        Row: {
          id: string
          associate_id: string
          week_number: number
          year: number
          weekly_capacity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          associate_id: string
          week_number: number
          year: number
          weekly_capacity: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          associate_id?: string
          week_number?: number
          year?: number
          weekly_capacity?: number
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          project_id: string
          project_name: string
          client: string
          project_date: string
          week_number: number
          year: number
          priority: 'low' | 'medium' | 'high' | 'urgent'
          status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'
          comments: string | null
          assigned_associate_id: string | null
          assigned_associate_name: string | null
          completion_date: string | null
          source: 'manual' | 'opening_balance' | 'api' | 'import'
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          project_name: string
          client: string
          project_date: string
          week_number?: number
          year?: number
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          status?: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'
          comments?: string | null
          assigned_associate_id?: string | null
          assigned_associate_name?: string | null
          completion_date?: string | null
          source?: 'manual' | 'opening_balance' | 'api' | 'import'
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          project_name?: string
          client?: string
          project_date?: string
          week_number?: number
          year?: number
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          status?: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'
          comments?: string | null
          assigned_associate_id?: string | null
          assigned_associate_name?: string | null
          completion_date?: string | null
          source?: 'manual' | 'opening_balance' | 'api' | 'import'
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
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
        }
        Update: {
          id?: string
          project_id?: string
          associate_id?: string
          assigned_by?: string
          assigned_at?: string
          recommended_associate_id?: string | null
          override_reason?: string | null
          is_override?: boolean
        }
      }
      recommendations: {
        Row: {
          id: string
          project_id: string
          recommended_associate_id: string
          recommended_associate_name: string
          workload_before: number
          workload_after: number
          explanation: string
          was_accepted: boolean
          actual_assigned_associate_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          recommended_associate_id: string
          recommended_associate_name: string
          workload_before?: number
          workload_after?: number
          explanation: string
          was_accepted?: boolean
          actual_assigned_associate_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          recommended_associate_id?: string
          recommended_associate_name?: string
          workload_before?: number
          workload_after?: number
          explanation?: string
          was_accepted?: boolean
          actual_assigned_associate_id?: string | null
          created_at?: string
        }
      }
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
          week_number?: number
          year?: number
          assigned_associate_id: string
          imported_by: string
          imported_at?: string
          import_batch_id: string
        }
        Update: {
          id?: string
          project_id?: string
          project_name?: string
          client?: string
          project_date?: string
          week_number?: number
          year?: number
          assigned_associate_id?: string
          imported_by?: string
          imported_at?: string
          import_batch_id?: string
        }
      }
      opening_balance_import_logs: {
        Row: {
          id: string
          batch_id: string
          total_records: number
          successful_imports: number
          failed_imports: number
          errors: Json | null
          imported_by: string
          imported_at: string
        }
        Insert: {
          id?: string
          batch_id: string
          total_records?: number
          successful_imports?: number
          failed_imports?: number
          errors?: Json | null
          imported_by: string
          imported_at?: string
        }
        Update: {
          id?: string
          batch_id?: string
          total_records?: number
          successful_imports?: number
          failed_imports?: number
          errors?: Json | null
          imported_by?: string
          imported_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string
          user_email: string
          action: string
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
          action: string
          entity_type: string
          entity_id?: string | null
          old_value?: Json | null
          new_value?: Json | null
          metadata?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          user_email?: string
          action?: string
          entity_type?: string
          entity_id?: string | null
          old_value?: Json | null
          new_value?: Json | null
          metadata?: Json | null
          ip_address?: string | null
          created_at?: string
        }
      }
      settings: {
        Row: {
          id: string
          organization_name: string
          week_start_day: number
          default_weekly_capacity: number
          enable_ai_recommendations: boolean
          enable_email_notifications: boolean
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
          theme?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_name?: string
          week_start_day?: number
          default_weekly_capacity?: number
          enable_ai_recommendations?: boolean
          enable_email_notifications?: boolean
          theme?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
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
        Returns: string
      }
    }
    Enums: {
      project_status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'
      project_priority: 'low' | 'medium' | 'high' | 'urgent'
      project_source: 'manual' | 'opening_balance' | 'api' | 'import'
      audit_action: string
    }
  }
}
