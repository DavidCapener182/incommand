'use client'

import { supabase as supabaseBrowserClient } from './supabaseBrowser'

export const supabase = supabaseBrowserClient

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
