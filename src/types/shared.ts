/**
 * Shared type definitions to eliminate repeated mismatches across the application
 */

import { Database } from './supabase'

// Core entity types based on actual database schema
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Event = Database['public']['Tables']['events']['Row']
export type Staff = Database['public']['Tables']['staff']['Row']
export type IncidentLog = Database['public']['Tables']['incident_logs']['Row']

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type EventInsert = Database['public']['Tables']['events']['Insert']
export type StaffInsert = Database['public']['Tables']['staff']['Insert']
export type IncidentLogInsert = Database['public']['Tables']['incident_logs']['Insert']

// Update types
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type EventUpdate = Database['public']['Tables']['events']['Update']
export type StaffUpdate = Database['public']['Tables']['staff']['Update']
export type IncidentLogUpdate = Database['public']['Tables']['incident_logs']['Update']

// Common utility types
export type WithId<T> = T & { id: number | string }
export type WithTimestamps<T> = T & {
  created_at: string
  updated_at: string
}

// Event data interface for analytics
export interface EventData {
  id: string
  name?: string | null
  venue_name?: string | null
  start_date?: string | null
  start_time?: string | null
  end_time?: string | null
  max_capacity?: number | null
  expected_attendance?: number | null
  company?: string | null
}

// Attendance record interface
export interface AttendanceRecord {
  id: number
  timestamp: string
  count: number
}

// Backup and restore types
export interface Backup {
  id: string
  name: string
  created_at: string
  size: number
  type: string
}

export interface RestoreJob {
  id: string
  backup_id: string
  status: string
  created_at: string
  completed_at?: string
}

// Push subscription types
export interface PushSubscriptionData {
  endpoint: string
  auth: string
  user_id: string
  active?: boolean
  browser?: string | null
  device_type?: string | null
  created_at?: string | null
}

// Notification types
export interface NotificationLog {
  type: string
  incident_id?: number
  recipients: number
  message: string
  sent_at: string
  status: string
}

// Export all types for easy importing
export * from './auditableLog'
export * from './supabase'
