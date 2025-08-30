export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const checks = {
      user_preferences: false,
      system_settings: false,
      notification_templates: false,
      scheduled_notifications: false,
      settings_audit_logs: false,
      user_notification_settings: false, // Old table
      errors: [] as string[]
    }

    // Check if new tables exist
    try {
      const { data: userPrefs, error: userPrefsError } = await supabase
        .from('user_preferences')
        .select('id')
        .limit(1)
      
      if (!userPrefsError) {
        checks.user_preferences = true
      } else {
        checks.errors.push(`user_preferences: ${userPrefsError.message}`)
      }
    } catch (error) {
      checks.errors.push(`user_preferences: ${error}`)
    }

    try {
      const { data: systemSettings, error: systemSettingsError } = await supabase
        .from('system_settings')
        .select('id')
        .limit(1)
      
      if (!systemSettingsError) {
        checks.system_settings = true
      } else {
        checks.errors.push(`system_settings: ${systemSettingsError.message}`)
      }
    } catch (error) {
      checks.errors.push(`system_settings: ${error}`)
    }

    try {
      const { data: notificationTemplates, error: notificationTemplatesError } = await supabase
        .from('notification_templates')
        .select('id')
        .limit(1)
      
      if (!notificationTemplatesError) {
        checks.notification_templates = true
      } else {
        checks.errors.push(`notification_templates: ${notificationTemplatesError.message}`)
      }
    } catch (error) {
      checks.errors.push(`notification_templates: ${error}`)
    }

    try {
      const { data: scheduledNotifications, error: scheduledNotificationsError } = await supabase
        .from('scheduled_notifications')
        .select('id')
        .limit(1)
      
      if (!scheduledNotificationsError) {
        checks.scheduled_notifications = true
      } else {
        checks.errors.push(`scheduled_notifications: ${scheduledNotificationsError.message}`)
      }
    } catch (error) {
      checks.errors.push(`scheduled_notifications: ${error}`)
    }

    try {
      const { data: auditLogs, error: auditLogsError } = await supabase
        .from('settings_audit_logs')
        .select('id')
        .limit(1)
      
      if (!auditLogsError) {
        checks.settings_audit_logs = true
      } else {
        checks.errors.push(`settings_audit_logs: ${auditLogsError.message}`)
      }
    } catch (error) {
      checks.errors.push(`settings_audit_logs: ${error}`)
    }

    // Check if old table exists (for comparison)
    try {
      const { data: oldNotificationSettings, error: oldNotificationSettingsError } = await supabase
        .from('user_notification_settings')
        .select('id')
        .limit(1)
      
      if (!oldNotificationSettingsError) {
        checks.user_notification_settings = true
      }
    } catch (error) {
      // Old table doesn't exist, which is expected
    }

    // Check if user has preferences
    let hasUserPreferences = false
    try {
      const { data: userPrefs, error: userPrefsError } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (!userPrefsError && userPrefs) {
        hasUserPreferences = true
      }
    } catch (error) {
      // User preferences don't exist yet
    }

    return NextResponse.json({
      success: true,
      checks,
      hasUserPreferences,
      userId: user.id,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Database check error:', error)
    return NextResponse.json({ error: 'Failed to check database' }, { status: 500 })
  }
}
