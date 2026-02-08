// @ts-nocheck
/**
 * Notification Settings Utilities
 * Server-side functions for managing user notification preferences
 */

import { getServiceSupabaseClient } from '@/lib/supabaseServer'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export interface NotificationSettings {
  userId: string
  // Email settings
  emailIncidents: boolean
  emailUpdates: boolean
  emailReports: boolean
  emailSocial: boolean
  // Push settings
  pushEnabled: boolean
  pushSound: boolean
  pushVibrate: boolean
  pushIncidents: boolean
  pushUpdates: boolean
  pushReports: boolean
  pushSocial: boolean
  // SMS settings
  smsEnabled: boolean
  smsEmergencyOnly: boolean
  smsNumber?: string | null
  // Quiet hours
  quietHoursEnabled: boolean
  quietHoursStart?: string | null
  quietHoursEnd?: string | null
}

/**
 * Get user's notification settings
 */
export async function getNotificationSettings(userId: string): Promise<NotificationSettings | null> {
  const supabase = getServiceSupabaseClient()

  const { data, error } = await supabase
    .from<any, any>('notification_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No settings found, return null
      return null
    }
    console.error('Failed to get notification settings:', error)
    throw error
  }

  return {
    userId: data.user_id,
    emailIncidents: data.email_incidents || false,
    emailUpdates: data.email_updates || false,
    emailReports: data.email_reports || false,
    emailSocial: data.email_social || false,
    pushEnabled: data.push_enabled || false,
    pushSound: data.push_sound || false,
    pushVibrate: data.push_vibrate || false,
    pushIncidents: data.push_incidents || false,
    pushUpdates: data.push_updates || false,
    pushReports: data.push_reports || false,
    pushSocial: data.push_social || false,
    smsEnabled: data.sms_enabled || false,
    smsEmergencyOnly: data.sms_emergency_only !== false, // Default to true
    smsNumber: data.sms_number || null,
    quietHoursEnabled: data.quiet_hours_enabled || false,
    quietHoursStart: data.quiet_hours_start || null,
    quietHoursEnd: data.quiet_hours_end || null,
  }
}

/**
 * Update user's notification settings
 */
export async function updateNotificationSettings(
  userId: string,
  settings: Partial<NotificationSettings>
): Promise<void> {
  const supabase = getServiceSupabaseClient()

  const updateData: Record<string, any> = {}

  if (settings.emailIncidents !== undefined) updateData.email_incidents = settings.emailIncidents
  if (settings.emailUpdates !== undefined) updateData.email_updates = settings.emailUpdates
  if (settings.emailReports !== undefined) updateData.email_reports = settings.emailReports
  if (settings.emailSocial !== undefined) updateData.email_social = settings.emailSocial
  if (settings.pushEnabled !== undefined) updateData.push_enabled = settings.pushEnabled
  if (settings.pushSound !== undefined) updateData.push_sound = settings.pushSound
  if (settings.pushVibrate !== undefined) updateData.push_vibrate = settings.pushVibrate
  if (settings.pushIncidents !== undefined) updateData.push_incidents = settings.pushIncidents
  if (settings.pushUpdates !== undefined) updateData.push_updates = settings.pushUpdates
  if (settings.pushReports !== undefined) updateData.push_reports = settings.pushReports
  if (settings.pushSocial !== undefined) updateData.push_social = settings.pushSocial
  if (settings.smsEnabled !== undefined) updateData.sms_enabled = settings.smsEnabled
  if (settings.smsEmergencyOnly !== undefined) updateData.sms_emergency_only = settings.smsEmergencyOnly
  if (settings.smsNumber !== undefined) updateData.sms_number = settings.smsNumber
  if (settings.quietHoursEnabled !== undefined) updateData.quiet_hours_enabled = settings.quietHoursEnabled
  if (settings.quietHoursStart !== undefined) updateData.quiet_hours_start = settings.quietHoursStart
  if (settings.quietHoursEnd !== undefined) updateData.quiet_hours_end = settings.quietHoursEnd

  const { error } = await supabase
    .from<any, any>('notification_settings')
    .upsert({
      user_id: userId,
      ...updateData,
    })

  if (error) {
    console.error('Failed to update notification settings:', error)
    throw error
  }
}

/**
 * Send test email to user. Uses Resend (or configured provider) when RESEND_API_KEY is set.
 */
export async function sendTestEmail(userId: string, recipientEmail?: string): Promise<void> {
  const { emailService } = await import('@/lib/notifications/emailService')
  const email = recipientEmail ?? (await getServiceSupabaseClient().from('profiles').select('email').eq('id', userId).single().then(({ data }) => data?.email))
  if (!email) throw new Error('No email address for user')
  await emailService.send({
    to: email,
    subject: 'Test email from inCommand',
    html: '<p>This is a test email to verify your notification settings.</p>',
    text: 'This is a test email to verify your notification settings.',
  })
}

/**
 * Send test push notification to user. Push is delivered via browser or FCM when configured.
 */
export async function sendTestPush(userId: string): Promise<void> {
  // Push is typically sent from client (browser Notification) or via FCM/OneSignal when configured
  console.log(`[Notification] Test push requested for user ${userId}`)
}

/**
 * Send test SMS to user. Uses Twilio (or configured provider) when TWILIO_* env vars are set.
 */
export async function sendTestSMS(userId: string, phoneNumber: string): Promise<void> {
  const { smsService } = await import('@/lib/notifications/smsService')
  await smsService.send({
    to: phoneNumber.trim(),
    message: 'Test SMS from inCommand. Your notification settings are working.',
  })
}

