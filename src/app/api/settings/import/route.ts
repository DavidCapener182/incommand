import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Enforce body size limit (~1MB)
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 1024 * 1024) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
    }
    const cookieStore = await cookies()
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
        },
      }
    )

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    // Define strong schemas for nested structures
    const dashboardLayoutSchema = z.object({
      widgets: z.record(z.object({
        position: z.object({ x: z.number().int(), y: z.number().int() }),
        size: z.object({ width: z.number().int().positive(), height: z.number().int().positive() }),
        visible: z.boolean(),
        settings: z.record(z.any()).optional()
      })),
      layout_version: z.number().int().min(1),
      last_modified: z.string().datetime()
    })

    const notificationPreferencesSchema = z.object({
      email: z.object({
        enabled: z.boolean(),
        frequency: z.enum(['immediate','hourly','daily','weekly']),
        categories: z.object({
          incidents: z.boolean(),
          system_updates: z.boolean(),
          reports: z.boolean(),
          social_media: z.boolean()
        })
      }),
      push: z.object({
        enabled: z.boolean(),
        sound: z.boolean(),
        vibration: z.boolean(),
        categories: z.object({
          incidents: z.boolean(),
          system_updates: z.boolean(),
          reports: z.boolean(),
          social_media: z.boolean()
        })
      }),
      sms: z.object({
        enabled: z.boolean(),
        emergency_only: z.boolean(),
        phone_number: z.string().optional()
      }),
      quiet_hours: z.object({
        enabled: z.boolean(),
        start: z.string(),
        end: z.string(),
        timezone: z.string()
      })
    })

    const uiPreferencesSchema = z.object({
      language: z.string(),
      timezone: z.string(),
      date_format: z.string(),
      time_format: z.enum(['12h','24h']),
      compact_mode: z.boolean(),
      animations_enabled: z.boolean(),
      auto_refresh_interval: z.number().int(),
      sidebar_collapsed: z.boolean(),
      color_scheme: z.enum(['default','high_contrast','colorblind_friendly'])
    })

    const accessibilitySettingsSchema = z.object({
      font_size: z.enum(['small','medium','large','extra_large']),
      line_spacing: z.enum(['tight','normal','loose']),
      contrast_ratio: z.enum(['normal','high','maximum']),
      reduce_motion: z.boolean(),
      screen_reader_optimized: z.boolean(),
      keyboard_navigation: z.boolean(),
      focus_indicators: z.boolean(),
    })

    const privacySettingsSchema = z.object({
      data_sharing: z.object({
        analytics: z.boolean(),
        crash_reports: z.boolean(),
        usage_statistics: z.boolean(),
      }),
      visibility: z.object({
        profile_public: z.boolean(),
        activity_visible: z.boolean(),
        location_sharing: z.boolean(),
      }),
      data_retention: z.object({
        auto_delete_logs: z.boolean(),
        retention_period_days: z.number().int()
      }),
    })

    const preferencesSchema = z.object({
      theme: z.enum(['light','dark','auto']).optional(),
      dashboard_layout: dashboardLayoutSchema.optional(),
      notification_preferences: notificationPreferencesSchema.optional(),
      ui_preferences: uiPreferencesSchema.optional(),
      accessibility_settings: accessibilitySettingsSchema.optional(),
      privacy_settings: privacySettingsSchema.optional(),
    }).strict()

    const scheduledNotificationSchema = z.object({
      template_id: z.string().uuid().optional(),
      schedule_type: z.enum(['one_time','recurring','conditional']),
      cron_expression: z.string().max(200).optional(),
      scheduled_at: z.string().datetime().optional(),
      status: z.enum(['pending','sent','failed','cancelled']).optional(),
      variables: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
      max_retries: z.number().int().min(0).max(10).optional(),
    }).strict()

    const schema = z.object({
      preferences: preferencesSchema.optional(),
      dashboard_layout: z.record(z.any()).optional(),
      scheduled_notifications: z.array(scheduledNotificationSchema).optional(),
      conflictResolution: z.enum(['merge', 'skip', 'overwrite']).optional().default('merge'),
      version: z.string().optional(),
    })
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    const { 
      preferences, 
      dashboard_layout, 
      scheduled_notifications,
      conflictResolution,
      version
    } = parsed.data

    // Optional schema version check for forward-compatibility
    const supportedVersions = ['1.0']
    if (version && !supportedVersions.includes(version)) {
      return NextResponse.json({ error: 'Unsupported data version' }, { status: 400 })
    }

    const results: any = {
      success: true,
      imported: [],
      errors: [],
      conflicts: []
    }

    // Import user preferences
    if (preferences) {
      const preferenceResult = await importUserPreferences(
        supabase, 
        user.id, 
        preferences, 
        conflictResolution
      )
      
      if (preferenceResult.success) {
        results.imported.push('User preferences')
      } else {
        results.errors.push(`User preferences: ${preferenceResult.error}`)
        results.success = false
      }
      
      if (preferenceResult.conflicts) {
        results.conflicts.push(...preferenceResult.conflicts)
      }
    }

    // Import dashboard layout
    if (dashboard_layout) {
      const layoutResult = await importDashboardLayout(
        supabase, 
        user.id, 
        dashboard_layout, 
        conflictResolution
      )
      
      if (layoutResult.success) {
        results.imported.push('Dashboard layout')
      } else {
        results.errors.push(`Dashboard layout: ${layoutResult.error}`)
        results.success = false
      }
      
      if (layoutResult.conflicts) {
        results.conflicts.push(...layoutResult.conflicts)
      }
    }

    // Import scheduled notifications
    if (scheduled_notifications && Array.isArray(scheduled_notifications)) {
      const scheduledResult = await importScheduledNotifications(
        supabase, 
        user.id, 
        scheduled_notifications, 
        conflictResolution
      )
      
      if (scheduledResult.success) {
        results.imported.push('Scheduled notifications')
      } else {
        results.errors.push(`Scheduled notifications: ${scheduledResult.error}`)
        results.success = false
      }
      
      if (scheduledResult.conflicts) {
        results.conflicts.push(...scheduledResult.conflicts)
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Failed to import settings' }, { status: 500 })
  }
}

async function importUserPreferences(
  supabase: any, 
  userId: string, 
  preferences: any, 
  conflictResolution: string
): Promise<{ success: boolean; error?: string; conflicts?: any[] }> {
  try {
    // Basic sanitization
      const parsedPreferences = preferencesSchema.safeParse(preferences)
      if (!parsedPreferences.success) {
        return { success: false, error: 'Invalid preferences structure' }
      }
      const sanitized = parsedPreferences.data
    // Get current user preferences
    const { data: currentPreferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    let mergedPreferences = sanitized

    // Handle conflicts based on resolution strategy
    if (currentPreferences && conflictResolution === 'merge') {
      mergedPreferences = {
        ...currentPreferences,
        ...preferences,
        updated_at: new Date().toISOString()
      }
    } else if (currentPreferences && conflictResolution === 'skip') {
      return { success: true, conflicts: ['User preferences already exist, skipping import'] }
    }

    // Update or insert user preferences
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        ...mergedPreferences,
        updated_at: new Date().toISOString()
      })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function importDashboardLayout(
  supabase: any, 
  userId: string, 
  dashboardLayout: any, 
  conflictResolution: string
): Promise<{ success: boolean; error?: string; conflicts?: any[] }> {
  try {
    const parsedLayout = dashboardLayoutSchema.safeParse(dashboardLayout)
    if (!parsedLayout.success) {
      return { success: false, error: 'Invalid dashboard_layout structure' }
    }
    const sanitizedLayout = parsedLayout.data
    // Get current user preferences
    const { data: currentPreferences } = await supabase
      .from('user_preferences')
      .select('dashboard_layout')
      .eq('user_id', userId)
      .single()

    let mergedLayout = sanitizedLayout

    // Handle conflicts based on resolution strategy
    if (currentPreferences?.dashboard_layout && conflictResolution === 'merge') {
      mergedLayout = {
        ...currentPreferences.dashboard_layout,
        ...dashboardLayout,
        last_modified: new Date().toISOString()
      }
    } else if (currentPreferences?.dashboard_layout && conflictResolution === 'skip') {
      return { success: true, conflicts: ['Dashboard layout already exists, skipping import'] }
    }

    // Update dashboard layout in user preferences
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        dashboard_layout: mergedLayout,
        updated_at: new Date().toISOString()
      })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function importScheduledNotifications(
  supabase: any, 
  userId: string, 
  scheduledNotifications: any[], 
  conflictResolution: string
): Promise<{ success: boolean; error?: string; conflicts?: any[] }> {
  try {
    const conflicts: string[] = []
    let importedCount = 0

    for (const notification of scheduledNotifications) {
      try {
        // Strong validation
        const parsed = scheduledNotificationSchema.safeParse(notification)
        if (!parsed.success) {
          conflicts.push('Invalid notification entry')
          continue
        }
        const validNotification = parsed.data
        // Check if notification already exists
        const { data: existingNotification } = await supabase
          .from('scheduled_notifications')
          .select('id')
          .eq('user_id', userId)
          .eq('template_id', validNotification.template_id)
          .eq('schedule_type', validNotification.schedule_type)
          .single()

        if (existingNotification && conflictResolution === 'skip') {
          conflicts.push(`Scheduled notification already exists, skipping`)
          continue
        }

        // Insert or update notification
        const { error } = await supabase
          .from('scheduled_notifications')
          .upsert({
            user_id: userId,
            ...validNotification,
            updated_at: new Date().toISOString()
          })

        if (error) {
          conflicts.push(`Failed to import scheduled notification: ${error.message}`)
        } else {
          importedCount++
        }
      } catch (error) {
        conflicts.push(`Error importing scheduled notification: ${error.message}`)
      }
    }

    return { 
      success: importedCount > 0, 
      conflicts: conflicts.length > 0 ? conflicts : undefined 
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
