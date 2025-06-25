'use client'

import { createClient } from '@supabase/supabase-js'

// Use dummy values if environment variables are not set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Log warnings if environment variables are missing
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn('Warning: Missing NEXT_PUBLIC_SUPABASE_URL environment variable, using placeholder')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('Warning: Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable, using placeholder')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

export const createUser = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      console.warn('Auth error:', error.message)
      return null
    }

    return data
  } catch (err) {
    console.warn('Unexpected error:', err)
    return null
  }
}

/**
 * Logs OpenAI usage to the ai_usage_logs table in Supabase.
 * @param {Object} params
 * @param {string} params.event_id - The event ID (uuid) if available
 * @param {string} params.user_id - The user ID (uuid) if available
 * @param {string} params.endpoint - The API endpoint (e.g., '/api/ai-insights')
 * @param {string} params.model - The OpenAI model used
 * @param {number} params.tokens_used - The number of tokens used
 * @param {number} params.cost_usd - The estimated cost in USD
 */
export async function logAIUsage({ 
  event_id, 
  user_id, 
  endpoint, 
  model, 
  tokens_used, 
  cost_usd 
}: {
  event_id?: string;
  user_id?: string;
  endpoint: string;
  model: string;
  tokens_used?: number | null;
  cost_usd?: number | null;
}) {
  try {
    const { error } = await supabase.from('ai_usage_logs').insert([
      {
        event_id,
        user_id,
        endpoint,
        model,
        tokens_used,
        cost_usd,
      },
    ]);
    if (error) {
      console.warn('Failed to log AI usage:', error.message);
    }
  } catch (err) {
    console.warn('Unexpected error logging AI usage:', err);
  }
} 