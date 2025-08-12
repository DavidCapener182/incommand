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
    const schema = z.object({
      preferences: z.any().optional(),
      dashboard_layout: z.any().optional(),
      scheduled_notifications: z.array(z.any()).optional(),
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
    const sanitized = typeof preferences === 'object' ? preferences : {}
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
    const sanitizedLayout = typeof dashboardLayout === 'object' ? dashboardLayout : {}
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
        // Basic validation
        if (!notification || typeof notification !== 'object') {
          conflicts.push('Invalid notification entry')
          continue
        }
        // Check if notification already exists
        const { data: existingNotification } = await supabase
          .from('scheduled_notifications')
          .select('id')
          .eq('user_id', userId)
          .eq('template_id', notification.template_id)
          .eq('schedule_type', notification.schedule_type)
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
            ...notification,
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
