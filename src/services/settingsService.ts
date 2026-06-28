/**
 * Settings Service
 * Handles application settings management
 */

import { supabase } from '@/lib/supabase'
import type { Settings } from '@/types'
import { createAuditLog } from './auditService'

/**
 * Get application settings
 */
export async function getSettings() {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .single()

    if (error) throw error
    return { data: data as Settings, error: null }
  } catch (error: any) {
    console.error('Error fetching settings:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Update application settings
 */
export async function updateSettings(updates: Partial<Omit<Settings, 'id' | 'created_at' | 'updated_at'>>) {
  try {
    // Get old settings for audit
    const { data: oldSettings } = await getSettings()

    // Get the settings ID (there should only be one row)
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('id')
      .single()

    if (settingsError) throw settingsError

    const { data, error } = await supabase
      .from('settings')
      .update(updates)
      .eq('id', settings.id)
      .select()
      .single()

    if (error) throw error

    // Create audit log
    await createAuditLog({
      action: 'update_settings',
      entityType: 'settings',
      entityId: settings.id,
      oldValue: oldSettings || undefined,
      newValue: data,
    })

    return { data: data as Settings, error: null }
  } catch (error: any) {
    console.error('Error updating settings:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Initialize default settings
 */
export async function initializeSettings() {
  try {
    const { data, error } = await supabase
      .from('settings')
      .insert({
        organization_name: 'WBIPAS Organization',
        week_start_day: 1, // Monday
        default_weekly_capacity: 5,
        enable_ai_recommendations: false,
        enable_email_notifications: false,
        theme: 'light',
      })
      .select()
      .single()

    if (error) throw error
    return { data: data as Settings, error: null }
  } catch (error: any) {
    console.error('Error initializing settings:', error)
    return { data: null, error: error.message }
  }
}
