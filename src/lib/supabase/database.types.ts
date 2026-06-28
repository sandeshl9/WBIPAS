/**
 * SUPABASE DATABASE TYPES
 * 
 * Auto-generated types from database schema
 * Run: npx supabase gen types typescript --local > src/lib/supabase/database.types.ts
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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'admin' | 'manager' | 'viewer'
          avatar_url: string | null
          theme: 'light' | 'dark' | 'system'
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role?: 'admin' | 'manager' | 'viewer'
          avatar_url?: string | null
          theme?: 'light' | 'dark' | 'system'
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'admin' | 'manager' | 'viewer'
          avatar_url?: string | null
          theme?: 'light' | 'dark' | 'system'
          preferences?: Json
          updated_at?: string
        }
      }
      associates: {
        Row: {
          id: string
          employee_code: string
          name: string
          email: string
          default_weekly_capacity: number
          availability_status: 'available' | 'leave' | 'training' | 'holiday' | 'inactive'
          department: string | null
          designation: string | null
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_code: string
          name: string
          email: string
          default_weekly_capacity?: number
          availability_status?: 'available' | 'leave' | 'training' | 'holiday' | 'inactive'
          department?: string | null
          designation?: string | null
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_code?: string
          name?: string
          email?: string
          default_weekly_capacity?: number
          availability_status?: 'available' | 'leave' | 'training' | 'holiday' | 'inactive'
          department?: string | null
          designation?: string | null
          is_active?: boolean
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          project_id: string
          project_name: string
          client_name: string
          project_date: string
          week_number: number
          year: number
          priority: 'low' | 'medium' | 'high' | 'urgent'
          status: 'pending' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'
          comments: string | null
          source: 'manual' | 'opening_balance' | 'import'
          completed_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          project_name: string
          client_name: string
          project_date: string
          week_number: number
          year: number
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          status?: 'pending' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'
          comments?: string | null
          source?: 'manual' | 'opening_balance' | 'import'
          completed_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          project_name?: string
          client_name?: string
          project_date?: string
          week_number?: number
          year?: number
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          status?: 'pending' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'
          comments?: string | null
          source?: 'manual' | 'opening_balance' | 'import'
          completed_at?: string | null
          updated_at?: string
        }
      }
      // Add more table types as needed
    }
    Views: {
      current_workload_view: {
        Row: {
          associate_id: string
          employee_code: string
          associate_name: string
          email: string
          default_weekly_capacity: number
          availability_status: string
          is_active: boolean
          active_workload: number
          remaining_capacity: number
          oldest_active_project_date: string | null
          utilization_percentage: number
        }
      }
      dashboard_kpis_view: {
        Row: {
          total_associates: number
          active_associates: number
          total_projects: number
          active_projects: number
          completed_projects: number
          assigned_today: number
          remaining_capacity: number
          avg_utilization: number
          avg_workload: number
          busy_associates: number
          idle_associates: number
        }
      }
    }
    Functions: {
      get_recommendation_candidates: {
        Args: {
          p_week_number: number
          p_year: number
        }
        Returns: {
          associate_id: string
          associate_name: string
          employee_code: string
          weekly_capacity: number
          weekly_assigned_count: number
          active_workload: number
          oldest_active_project_date: string | null
          utilization_percentage: number
          is_eligible: boolean
        }[]
      }
      assign_project: {
        Args: {
          p_project_id: string
          p_associate_id: string
          p_recommendation_log: Json
          p_was_overridden?: boolean
          p_override_reason?: string | null
        }
        Returns: Json
      }
      get_weekly_timeline: {
        Args: {
          p_weeks_ahead?: number
        }
        Returns: {
          associate_id: string
          associate_name: string
          week_number: number
          year: number
          capacity: number
          assigned_count: number
          utilization_percentage: number
        }[]
      }
    }
  }
}
