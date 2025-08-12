import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Distributed rate limiter with Upstash (falls back to in-memory if env not set)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  : null
const limiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, '10 m') })
  : null
const fallbackRateMap = new Map<string, { count: number; ts: number }>()
const FALLBACK_RATE_LIMIT = 30
const FALLBACK_RATE_WINDOW_MS = 10 * 60 * 1000

async function checkRateLimit(ip: string | undefined): Promise<boolean> {
  if (!ip) return true
  if (limiter) {
    const { success } = await limiter.limit(`export:${ip}`)
    return success
  }
  const now = Date.now()
  const entry = fallbackRateMap.get(ip)
  if (!entry || now - entry.ts > FALLBACK_RATE_WINDOW_MS) {
    fallbackRateMap.set(ip, { count: 1, ts: now })
    return true
  }
  if (entry.count >= FALLBACK_RATE_LIMIT) return false
  entry.count += 1
  return true
}

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown'
    if (!(await checkRateLimit(ip))) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }
    const supabase = createRouteHandlerClient({ cookies })

    // Get current user and role for permission-scoped export
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, company_id')
      .eq('id', user.id)
      .single()

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const format = (searchParams.get('format') || 'json').toLowerCase()
    if (!['json', 'csv'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
    }
    const includeNotifications = searchParams.get('notifications') !== 'false'
    const includeLayout = searchParams.get('layout') !== 'false'
    const includeActivity = searchParams.get('activity') !== 'false'

    const exportData: any = {
      export_date: new Date().toISOString(),
      user_id: user.id,
      version: '1.0'
    }

    // Get user preferences (includes notification preferences)
    const { data: preferences, error: preferencesError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!preferencesError && preferences) {
      exportData.preferences = preferences
    }

    // Get dashboard layout
    if (includeLayout) {
      // This would be part of user preferences, but we can extract it separately
      if (exportData.preferences?.dashboard_layout) {
        exportData.dashboard_layout = exportData.preferences.dashboard_layout
      }
    }

    // Get user's scheduled notifications
    const { data: scheduledNotifications, error: scheduledError } = await supabase
      .from('scheduled_notifications')
      .select(`
        *,
        notification_templates (
          template_name,
          subject,
          body,
          category
        )
      `)
      .eq('user_id', user.id)

    if (!scheduledError && scheduledNotifications) {
      exportData.scheduled_notifications = scheduledNotifications
    }

    // Get user's recent activity (last 30 days)
    if (includeActivity) {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: recentActivity, error: activityError } = await supabase
        .from('settings_audit_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(100)

      if (!activityError && recentActivity) {
        exportData.recent_activity = recentActivity
      }
    }

    // Format response based on requested format
    if (format === 'csv') {
      // Convert to CSV format (simplified)
      const csvData = convertToCSV(exportData)
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="settings-export-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    } else {
      // JSON format (default)
      return NextResponse.json(sanitizeExport(exportData), {
        headers: {
          'Content-Disposition': `attachment; filename="settings-export-${new Date().toISOString().split('T')[0]}.json"`
        }
      })
    }
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Failed to export settings' }, { status: 500 })
  }
}

// Helper function to convert data to CSV format
function convertToCSV(data: any): string {
  const rows = []
  
  // Add header
  rows.push(['Setting', 'Value'])
  
  // Add preferences
  if (data.preferences) {
    rows.push(['Theme', data.preferences.theme])
    rows.push(['Language', data.preferences.ui_preferences?.language || 'en'])
    rows.push(['Timezone', data.preferences.ui_preferences?.timezone || 'UTC'])
    
    // Notification preferences
    if (data.preferences.notification_preferences) {
      const np = data.preferences.notification_preferences
      rows.push(['Email Notifications', np.email?.enabled ? 'Enabled' : 'Disabled'])
      rows.push(['Push Notifications', np.push?.enabled ? 'Enabled' : 'Disabled'])
      rows.push(['SMS Notifications', np.sms?.enabled ? 'Enabled' : 'Disabled'])
      rows.push(['Quiet Hours', np.quiet_hours?.enabled ? 'Enabled' : 'Disabled'])
    }
  }
  
  return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
}

// Remove sensitive fields
function sanitizeExport(data: any) {
  const clone = JSON.parse(JSON.stringify(data))
  if (clone.preferences) {
    delete clone.preferences.user_id
    delete clone.preferences.id
  }
  if (clone.recent_activity) {
    clone.recent_activity = clone.recent_activity.map((a: any) => ({
      ...a,
      ip_address: undefined,
      user_agent: undefined,
    }))
  }
  return clone
}

// POST method for bulk export (admin only)
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || (request as any).ip || 'unknown'
    if (!(await checkRateLimit(ip))) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, company_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !['admin', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const schema = z.object({
      user_ids: z.array(z.string().uuid()).min(1).max(100),
      format: z.enum(['json', 'csv']).optional(),
    })
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    const { user_ids, format = 'json' } = parsed.data

    // Limit bulk export to prevent abuse
    if (user_ids.length > 100) {
      return NextResponse.json({ error: 'Bulk export limited to 100 users' }, { status: 400 })
    }

    const bulkExportData: any = {
      export_metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        exported_by: user.id,
        export_format: format,
        data_schema: 'bulk_settings_export_v1',
        user_count: user_ids.length
      },
      users: []
    }

    // Export data for each user
    for (const userId of user_ids) {
      const userData: any = {
        user_id: userId
      }

      // Get user profile
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      // Permission validation: same company scope for non-superadmin
      if (userProfile) {
        if (profile.role !== 'superadmin' && profile.company_id && userProfile.company_id && userProfile.company_id !== profile.company_id) {
          continue
        }
        userData.profile = {
          ...userProfile,
          password: undefined,
          email_verified: undefined
        }
      }

      // Get user preferences
      const { data: userPreferences } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (userPreferences) {
        userData.preferences = userPreferences
      }

      // Get notification settings
      const { data: userNotificationSettings } = await supabase
        .from('user_notification_settings')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (userNotificationSettings) {
        userData.notification_settings = userNotificationSettings
      }

      bulkExportData.users.push(userData)
    }

    // Format response
    if (format === 'csv') {
      // For bulk export, CSV would be more complex - return JSON for now
      return NextResponse.json(bulkExportData, {
        headers: {
          'Content-Disposition': `attachment; filename="bulk_settings_export_${new Date().toISOString().split('T')[0]}.json"`
        }
      })
    } else {
      return NextResponse.json(bulkExportData, {
        headers: {
          'Content-Disposition': `attachment; filename="bulk_settings_export_${new Date().toISOString().split('T')[0]}.json"`
        }
      })
    }

  } catch (error) {
    console.error('Error in bulk export:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk export' },
      { status: 500 }
    )
  }
}
