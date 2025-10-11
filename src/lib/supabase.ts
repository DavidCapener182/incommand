'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Use the Next.js auth-helpers client so browser sessions are synced to server via cookies
export const supabase = createClientComponentClient()

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
