import { getServiceSupabaseClient } from '@/lib/supabaseServer'

export async function checkRateLimits(opts: { userId?: string | null, incidentHash: string }) {
  const supabase = getServiceSupabaseClient()
  const now = new Date()
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000).toISOString()

  // Per-incident hash limit: 30/min
  const { count: hashCount } = await supabase
    .from('best_practice_cache')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', oneMinuteAgo)
    .eq('incident_hash', opts.incidentHash)

  // Per-user limit: 6/min — approximate using cache join not ideal; skip if no userId
  let userOk = true
  if (opts.userId) {
    const { count } = await supabase
      .from('ai_usage_logs')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', oneMinuteAgo)
      .eq('user_id', opts.userId)
      .ilike('endpoint', '%/api/best-practice%')
    userOk = (count || 0) < 6
  }

  const perIncidentOk = (hashCount || 0) < 30
  return { allowed: userOk && perIncidentOk, perIncidentOk, userOk }
}


