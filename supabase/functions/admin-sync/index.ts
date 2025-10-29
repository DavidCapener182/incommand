// @ts-nocheck
// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.1'

interface SyncPayload {
  organizationId?: string
  trigger?: 'manual' | 'scheduled'
  metadata?: Record<string, unknown>
}

function getEnv(name: string): string {
  const value = Deno.env.get(name)
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

async function handleRequest(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  let payload: SyncPayload | null = null
  try {
    payload = (await request.json()) as SyncPayload
  } catch {
    payload = null
  }

  const supabaseUrl = getEnv('SUPABASE_URL')
  const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const organizationId = payload?.organizationId ?? null
  const trigger = payload?.trigger ?? 'manual'

  const start = Date.now()

  const { data: pendingActions, error: actionsError } = await supabase
    .from('admin_actions')
    .select('id, action_type, status')
    .eq('status', 'pending')
    .limit(50)

  if (actionsError) {
    console.error('Failed to read pending admin actions', actionsError)
  }

  const { error: auditError } = await supabase.from('admin_audit_log').insert({
    admin_id: null,
    table_name: 'admin_sync',
    record_id: crypto.randomUUID(),
    action_type: 'sync',
    changes: {
      trigger,
      organizationId,
      pendingActionCount: pendingActions?.length ?? 0,
    },
  })

  if (auditError) {
    console.error('Failed to write audit entry for admin sync', auditError)
  }

  const durationMs = Date.now() - start

  return new Response(
    JSON.stringify({
      success: true,
      trigger,
      organizationId,
      pendingActionCount: pendingActions?.length ?? 0,
      durationMs,
    }),
    {
      headers: { 'content-type': 'application/json' },
    }
  )
}

Deno.serve(handleRequest)
