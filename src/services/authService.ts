/**
 * Authentication Service
 * Handles user authentication and session management
 */

import { supabase } from '@/lib/supabase'
import type { User } from '@/types'
import { createAuditLog } from './auditService'

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    // Create audit log
    if (data.user) {
      await createAuditLog({
        action: 'login',
        entityType: 'user',
        entityId: data.user.id,
      })
    }

    return { data, error: null }
  } catch (error: any) {
    console.error('Error signing in:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Sign up new user
 */
export async function signUp(email: string, password: string, fullName: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) throw error

    // Create user record in public.users table
    if (data.user) {
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName,
          role: 'manager', // Default role
        })

      if (userError) throw userError
    }

    return { data, error: null }
  } catch (error: any) {
    console.error('Error signing up:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    // Create audit log before signing out
    if (user) {
      await createAuditLog({
        action: 'logout',
        entityType: 'user',
        entityId: user.id,
      })
    }

    const { error } = await supabase.auth.signOut()

    if (error) throw error

    return { data: true, error: null }
  } catch (error: any) {
    console.error('Error signing out:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) throw error
    if (!user) return { data: null, error: null }

    // Get user details from public.users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (userError) throw userError

    return { data: userData as User, error: null }
  } catch (error: any) {
    console.error('Error getting current user:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(updates: { full_name?: string }) {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error

    return { data: data as User, error: null }
  } catch (error: any) {
    console.error('Error updating user profile:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Reset password
 */
export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) throw error

    return { data: true, error: null }
  } catch (error: any) {
    console.error('Error resetting password:', error)
    return { data: null, error: error.message }
  }
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) throw error

    return { data: true, error: null }
  } catch (error: any) {
    console.error('Error updating password:', error)
    return { data: null, error: error.message }
  }
}
