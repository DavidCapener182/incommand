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