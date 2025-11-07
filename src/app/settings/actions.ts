'use server'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { updateNotificationSettings } from '@/lib/notifications'
import { logClientEvent } from '@/analytics/events'
import { getServiceSupabaseClient } from '@/lib/supabaseServer'
import { logger } from '@/lib/logger'
import type { Database } from '@/types/supabase'

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  phone: z.string().max(20).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
})

export async function updateProfile(formData: FormData) {
  try {
    const cookieStore = cookies()
    const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore })
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    const rawData = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      phone: formData.get('phone'),
    }

    const validated = profileSchema.parse(rawData)

    const { error } = await supabase
      .from<Database['public']['Tables']['profiles']['Row'], Database['public']['Tables']['profiles']['Update']>('profiles')
      .update({
        first_name: validated.firstName,
        last_name: validated.lastName,
        phone_number: validated.phone || null,
      })
      .eq('id', user.id)

    if (error) {
      logClientEvent('settings_save_failure', { userId: user.id, error: error.message })
      return { error: error.message }
    }

    logClientEvent('settings_save_success', { userId: user.id, field: 'profile' })
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    return { error: 'Failed to update profile' }
  }
}

export async function updateNotificationPreference(
  userId: string,
  settings: Record<string, any>
) {
  try {
    await updateNotificationSettings(userId, settings)
    logClientEvent('settings_save_success', { userId, field: 'notifications' })
    return { success: true }
  } catch (error) {
    logClientEvent('settings_save_failure', { userId, error: error instanceof Error ? error.message : 'Unknown error' })
    return { error: error instanceof Error ? error.message : 'Failed to update notifications' }
  }
}

export async function endEvent(eventId: string) {
  try {
    console.log('[endEvent] Starting endEvent server action', { eventId });
    const cookieStore = cookies()
    const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore })
    
    console.log('[endEvent] Getting user from session...');
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    console.log('[endEvent] User check result', {
      hasUser: !!user,
      userId: user?.id,
      error: userError?.message
    });
    
    if (userError) {
      console.error('[endEvent] Error getting user', userError);
      logger.error('Error getting user in endEvent', userError, {
        component: 'endEvent',
        action: 'endEvent',
        eventId
      });
      return { error: `Authentication error: ${userError.message}` }
    }
    
    if (!user) {
      console.error('[endEvent] No user found');
      logger.warn('No user found in endEvent', {
        component: 'endEvent',
        action: 'endEvent',
        eventId
      });
      return { error: 'Not authenticated' }
    }

    console.log('[endEvent] Updating event', {
      eventId,
      userId: user.id,
      settingIsCurrent: false
    });

    // Update the event to set is_current = false
    const { error, data } = await supabase
      .from<Database['public']['Tables']['events']['Row'], Database['public']['Tables']['events']['Update']>('events')
      .update({ is_current: false })
      .eq('id', eventId)
      .select('id, event_name')
      .single()

    if (error) {
      console.error('[endEvent] Failed to update event', error);
      logger.error('Failed to end event', error, {
        component: 'endEvent',
        action: 'endEvent',
        eventId,
        userId: user.id
      })
      return { error: error.message }
    }

    console.log('[endEvent] Event ended successfully', {
      eventId,
      eventName: data?.event_name,
      userId: user.id
    });

    logger.info('Event ended successfully', {
      component: 'endEvent',
      action: 'endEvent',
      eventId,
      eventName: data?.event_name,
      userId: user.id
    })

    return { success: true }
  } catch (error) {
    console.error('[endEvent] Exception in endEvent', error);
    logger.error('Error ending event', error, {
      component: 'endEvent',
      action: 'endEvent'
    })
    return { error: 'Failed to end event' }
  }
}

export async function deleteLog(logId: string) {
  try {
    const supabase = getServiceSupabaseClient()
    const numericLogId = parseInt(logId)

    // Delete related data first
    await supabase.from<Database['public']['Tables']['incident_events']['Row'], Database['public']['Tables']['incident_events']['Update']>('incident_events').delete().eq('incident_id', numericLogId)
    await supabase.from<Database['public']['Tables']['incident_attachments']['Row'], Database['public']['Tables']['incident_attachments']['Update']>('incident_attachments').delete().eq('incident_id', numericLogId)
    await supabase.from<Database['public']['Tables']['incident_links']['Row'], Database['public']['Tables']['incident_links']['Update']>('incident_links').delete().or(`incident_id.eq.${numericLogId},linked_incident_id.eq.${numericLogId}`)
    await supabase.from<Database['public']['Tables']['incident_escalations']['Row'], Database['public']['Tables']['incident_escalations']['Update']>('incident_escalations').delete().eq('incident_id', numericLogId)
    await supabase.from<Database['public']['Tables']['incident_updates']['Row'], Database['public']['Tables']['incident_updates']['Update']>('incident_updates').delete().eq('incident_id', numericLogId)
    await supabase.from<Database['public']['Tables']['staff_assignments']['Row'], Database['public']['Tables']['staff_assignments']['Update']>('staff_assignments').delete().eq('incident_id', numericLogId)

    // Delete the main log
    const { error } = await supabase
      .from<Database['public']['Tables']['incident_logs']['Row'], Database['public']['Tables']['incident_logs']['Update']>('incident_logs')
      .delete()
      .eq('id', numericLogId)

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { error: 'Failed to delete log' }
  }
}

