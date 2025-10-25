'use client'

import { supabaseBrowserClient } from './supabaseBrowser'
import type { BrowserSupabaseClient } from './supabaseBrowser'

export const supabase: BrowserSupabaseClient = supabaseBrowserClient

export const createUser = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
      },
    })

    if (error) {
      return null
    }

    return data
  } catch (err) {
    return null
  }
}
