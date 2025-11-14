'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface CompanyEventContext {
  companyId: string
  eventId: string
}

/**
 * Resolves the current user's company_id and active event_id so API requests can be scoped correctly.
 * Optionally accepts a preferredEventId (e.g. from EventContext). If omitted, falls back to /api/get-current-event.
 */
export function useCompanyEventContext(preferredEventId?: string | null) {
  const [context, setContext] = useState<CompanyEventContext | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const resolveContext = async () => {
      setLoading(true)
      try {
        const [{ data: userResponse }, eventResponse] = await Promise.all([
          supabase.auth.getUser(),
          preferredEventId ? Promise.resolve(null) : fetch('/api/get-current-event'),
        ])

        const user = userResponse.user
        if (!user) {
          if (isMounted) setContext(null)
          return
        }

        let resolvedEventId = preferredEventId ?? null
        if (!resolvedEventId && eventResponse) {
          const eventJson = await eventResponse.json().catch(() => null)
          resolvedEventId = eventJson?.event?.id ?? null
        }

        if (!resolvedEventId) {
          if (isMounted) setContext(null)
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .maybeSingle()

        if (profileError || !profile?.company_id) {
          if (isMounted) setContext(null)
          return
        }

        if (isMounted) {
          setContext({
            companyId: profile.company_id,
            eventId: resolvedEventId,
          })
        }
      } catch (error) {
        console.error('Failed to resolve company/event context', error)
        if (isMounted) setContext(null)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    resolveContext()

    return () => {
      isMounted = false
    }
  }, [preferredEventId])

  return { context, loading }
}

