import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { logger } from './logger';

let serviceClient: SupabaseClient | null = null;

function ensureEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function getServiceSupabaseClient(): SupabaseClient {
  if (serviceClient) {
    return serviceClient;
  }

  const supabaseUrl = ensureEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = ensureEnv('SUPABASE_SERVICE_ROLE_KEY');

  serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  return serviceClient;
}

interface LogAIUsageParams {
  event_id?: string;
  user_id?: string;
  endpoint: string;
  model: string;
  tokens_used?: number | null;
  cost_usd?: number | null;
}

export async function logAIUsage(
  params: LogAIUsageParams,
  client?: SupabaseClient
) {
  let supabase: SupabaseClient;
  if (client) {
    supabase = client;
  } else {
    try {
      supabase = getServiceSupabaseClient();
    } catch (error) {
      logger.error('Supabase configuration error when logging AI usage', error, params);
      return;
    }
  }

  try {
    const { error } = await supabase.from('ai_usage_logs').insert([
      {
        event_id: params.event_id,
        user_id: params.user_id,
        endpoint: params.endpoint,
        model: params.model,
        tokens_used: params.tokens_used ?? null,
        cost_usd: params.cost_usd ?? null,
      },
    ]);

    if (error) {
      logger.error('Failed to log AI usage', error, params);
    } else {
      logger.debug('AI usage logged successfully', params);
    }
  } catch (err) {
    logger.error('Unexpected error logging AI usage', err, params);
  }
}
