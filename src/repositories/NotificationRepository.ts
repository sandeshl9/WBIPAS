/**
 * REPOSITORY LAYER - NotificationRepository
 * Pure CRUD operations for notifications table
 */

import { supabase } from '@/lib/supabase'
import type { Notification, NotificationInsert, NotificationUpdate } from '@/types/database-enterprise'

export class NotificationRepository {
  /**
   * Get notifications for a user
   */
  static async findByUser(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    return { data, error }
  }

  /**
   * Get unread notifications for a user
   */
  static async findUnread(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false})

    return { data, error }
  }

  /**
   * Get notification count for a user
   */
  static async getUnreadCount(userId: string) {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    return { count, error }
  }

  /**
   * Get notifications by type
   */
  static async findByType(userId: string, type: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .order('created_at', { ascending: false })

    return { data, error }
  }

  /**
   * Create notification
   */
  static async create(notification: NotificationInsert) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single()

    return { data, error }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(id: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .select()

    return { data, error }
  }

  /**
   * Delete notification
   */
  static async delete(id: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)

    return { error }
  }

  /**
   * Delete all read notifications for a user
   */
  static async deleteRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .eq('is_read', true)

    return { error }
  }
}
