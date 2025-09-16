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
        emailRedirectTo: `${window.location.origin}/auth/callback`,
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
