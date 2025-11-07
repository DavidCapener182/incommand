import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { logger } from './logger'
import { env } from '@/config/env'

type TypedSupabaseClient = SupabaseClient<Database>

let serviceClient: TypedSupabaseClient | null = null
let anonClient: TypedSupabaseClient | null = null

function ensureEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

/**
 * Create a secure RLS-enabled Supabase client for server-side operations
 * This client respects Row Level Security policies and user context
 */
export function createRlsServerClient(headers: Headers): TypedSupabaseClient {
  const supabaseUrl = env.SUPABASE_URL
  const anonKey = env.SUPABASE_ANON_KEY

  return createClient<Database>(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        // Forward authorization header from request to maintain user context
        Authorization: headers.get('authorization') || '',
        // Forward other relevant headers for RLS
        'x-forwarded-for': headers.get('x-forwarded-for') || '',
        'user-agent': headers.get('user-agent') || '',
      },
    },
  })
}

export function getServiceSupabaseClient(): TypedSupabaseClient {
  if (serviceClient) {
    return serviceClient
  }

  const supabaseUrl = ensureEnv('SUPABASE_URL')
  const serviceRoleKey = ensureEnv('SUPABASE_SERVICE_ROLE_KEY')

  serviceClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })

  return serviceClient
}

export function getServiceClient(): TypedSupabaseClient {
  return getServiceSupabaseClient()
}

export function getAnonServerClient(): TypedSupabaseClient {
  if (anonClient) {
    return anonClient
  }

  const supabaseUrl = ensureEnv('SUPABASE_URL')
  const anonKey = ensureEnv('SUPABASE_ANON_KEY')

  anonClient = createClient<Database>(supabaseUrl, anonKey, {
    auth: { persistSession: false },
  })

  return anonClient
}

/**
 * @deprecated Use createRlsServerClient(headers) instead for better security
 * This method is kept for backward compatibility but should be migrated
 */
export function createRlsServerClientWithToken(token: string): TypedSupabaseClient {
  const supabaseUrl = env.SUPABASE_URL
  const anonKey = env.SUPABASE_ANON_KEY

  return createClient<Database>(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  })
}

interface LogAIUsageParams {
  event_id?: string
  user_id?: string
  endpoint: string
  model: string
  tokens_used?: number | null
  cost_usd?: number | null
}

export async function logAIUsage(
  params: LogAIUsageParams,
  client?: TypedSupabaseClient
) {
  let supabase: TypedSupabaseClient
  if (client) {
    supabase = client
  } else {
    try {
      supabase = getServiceSupabaseClient()
    } catch (error) {
      logger.error('Supabase configuration error when logging AI usage', error, params)
      return
    }
  }

  try {
    const { error } = await supabase.from<Database['public']['Tables']['ai_usage_logs']['Row'], Database['public']['Tables']['ai_usage_logs']['Update']>('ai_usage_logs').insert([
      {
        event_id: params.event_id,
        user_id: params.user_id,
        endpoint: params.endpoint,
        model: params.model,
        tokens_used: params.tokens_used ?? null,
        cost_usd: params.cost_usd ?? null,
      },
    ])

    if (error) {
      logger.error('Failed to log AI usage', error, params)
    } else {
      logger.debug('AI usage logged successfully', params)
    }
  } catch (err) {
    logger.error('Unexpected error logging AI usage', err, params)
  }
}
